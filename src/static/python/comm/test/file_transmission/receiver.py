# -*- coding: utf-8 -*-
"""
Created on Sat Jul  4 20:26:40 2020

@author: Editing
"""

from __future__ import with_statement, print_function

import hashlib
import os
import signal
import struct
import sys
import traceback

sys.path.insert(
    0,
    os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../..'))

from comm import ServerListener

import common

if len(sys.argv) < 3:
    print(
        'Usage: <Python interpreter> <this script> <server name> <server port>',
        file = sys.stderr)
    sys.exit(1)

exiting = False
def exit_handler(signum, frame):
    global exiting
    exiting = True
signal.signal(signal.SIGINT, exit_handler)
signal.signal(signal.SIGTERM, exit_handler)
print('Press Ctrl-C to exit.')

with \
    ServerListener(sys.argv[1], int(sys.argv[2]), common.TIMEOUT, 1) as \
        listener:
    while not exiting:
        try:
            with listener.accept() as connection:
                print('A connection has been accepted.')
                complete = True
                application_id, file_name = common.receive(connection)
                file_name = os.path.basename(file_name.decode('utf-8'))
                print('Application ID: {0}'.format(application_id))
                print('File name: {0}'.format(file_name))
                application_id_, length_total_bytes = common.receive(connection)
                if application_id_ != application_id:
                    raise Exception(
                        'The remote application ID is not consistent.')
                length_total, = struct.unpack('!Q', length_total_bytes)
                print('Length: {0} bytes'.format(length_total))
                length_received = 0
                hash = hashlib.sha256()
                with open(file_name, 'wb') as file:
                    while not exiting and length_received < length_total:
                        application_id_, data = common.receive(connection)
                        if application_id_ != application_id:
                            raise Exception(
                                'The remote application ID is not consistent.')
                        file.write(data)
                        hash.update(data)
                        length_received += len(data)
                if complete:
                    digest = hash.hexdigest()
                    common.send(
                        connection,
                        application_id,
                        bytearray(digest, 'utf-8'))
        except ServerListener.TimeoutException:
            pass
        except:
            print('An exception is raised when processing the client request:')
            traceback.print_exc()
