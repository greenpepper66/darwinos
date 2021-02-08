# -*- coding: utf-8 -*-
"""
Created on Sat Jul  4 17:55:37 2020

@author: Editing
"""

from __future__ import with_statement, print_function

import hashlib
import os
import struct
import sys

sys.path.insert(
    0,
    os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../..'))

from comm import ClientConnection

import common

LENGTH_LENGTH = 8

if len(sys.argv) < 6:
    print(
        'Usage: <Python interpreter> <this script> <server name> <server port> ' \
        '<application ID> <file path name> <data chunk size>',
        file = sys.stderr)
    sys.exit(1)

application_id_local = int(sys.argv[3])

chunk_size = int(sys.argv[5])
if chunk_size <= 0 or chunk_size > 2 ** (LENGTH_LENGTH << 3) - 1:
    print(
        'The data chunk size must be an integer within the range [1, {0}].'
        .format(2 ** (LENGTH_LENGTH << 3) - 1),
        file = sys.stderr)
    sys.exit(1)

buffer = bytearray(max(LENGTH_LENGTH, chunk_size))
buffer_length = memoryview(buffer)[: LENGTH_LENGTH]
buffer_chunk = memoryview(buffer)[: chunk_size]

length_total = 0

print('Computing checksum of the local file ...')
hash = hashlib.sha256()
with open(sys.argv[4], 'rb') as file:
    data = file.read(chunk_size)
    while len(data) == chunk_size:
        hash.update(data)
        length_total += chunk_size
        data = file.read(chunk_size)
    if len(data) > 0:
        hash.update(data)
        length_total += len(data)
digest_local = hash.hexdigest()
print('Checksum of the local file: {0}'.format(digest_local))

print('Transmitting the local file ...')
with \
    ClientConnection(sys.argv[1], int(sys.argv[2])) as connection, \
    open(sys.argv[4], 'rb') as file:
    common.send(
        connection,
        application_id_local,
        bytearray(os.path.basename(sys.argv[4]), 'utf-8'))
    struct.pack_into('!Q', buffer_length, 0, length_total)
    common.send(connection, application_id_local, buffer, LENGTH_LENGTH)
    length_sent = 0
    while length_sent < length_total:
        length_read = file.readinto(buffer_chunk)
        print(
            'Transmitting byte {0} to {1} ...'
            .format(length_sent + 1, length_sent + length_read))
        common.send(connection, application_id_local, buffer, length_read)
        length_sent += length_read
    application_id_remote, digest_remote = common.receive(connection)
print('Transmission is complete.')
digest_remote = digest_remote.decode('utf-8')
print('Checksum of the local file : {0}'.format(digest_local))
print('Remote application ID: {0}'.format(application_id_remote))
print('Checksum of the remote file: {0}'.format(digest_remote))
if application_id_remote != application_id_local or \
    digest_remote != digest_local:
    print(
        'The checksum of the remote file is not equal to the checksum of the ' \
        'local file.',
        file = sys.stderr)
    print('Transmission failed.')
    sys.exit(2)
print(
    'The checksum of the remote file is equal to the checksum of the local file.')
print('Transmission succeeded.')
