# -*- coding: utf-8 -*-
"""
Created on Sat Jul  4 18:46:17 2020

@author: Editing
"""
TIMEOUT = 5

ACKNOWLEDGMENT = bytearray(b'ACK')

def send(connection, application_id_out, buffer, length = None):
    connection.send(application_id_out, buffer, length)
    application_id_in, acknowledgment = connection.receive()
    while acknowledgment is None:
        application_id_in, acknowledgment = connection.receive()
    if application_id_in != application_id_out:
        raise Exception(
            'The application ID of the acknowledgment is not equal to that of ' \
            'the local application.')
    if acknowledgment != ACKNOWLEDGMENT:
        raise Exception('An invalid acknowledgment is received.')

def receive(connection):
    application_id, data = connection.receive()
    while data is None:
        application_id, data = connection.receive()
    connection.send(application_id, ACKNOWLEDGMENT)
    return application_id, data
