from django.core.exceptions import ObjectDoesNotExist
from channels.generic.websocket import WebsocketConsumer
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import *
import json
import requests
import threading
import time
import re

try:
    Connection.objects.all().delete()
    if len(User.objects.all()) == 0:
        user = User()
        user.name = 'BookTank Team'
        user.profile_picture_file = str(int(time.time() * 1000)) + '.jpg'
        user.save()
except:
    pass

class Consumer(WebsocketConsumer):
    def connect(self):
        self.accept()

    def disconnect(self, _):
        connection = Connection.objects.get(channel_name=self.channel_name)
        session = Session()
        session.user = connection.user
        session.status = 'Disconnected'
        session.save()
        connection.delete()

    def receive(self, text_data):
        data = json.loads(text_data)

        if data['action'] == 'connect':
            try:
                Connection.objects.get(user=data['userID']).delete()
            except ObjectDoesNotExist:
                pass
            connection = Connection()
            connection.user = User.objects.get(id=data['userID'])
            connection.channel_name = self.channel_name
            connection.save()
            session = Session()
            session.user = connection.user
            session.status = 'Connected'
            session.save()

        elif data['action'] == 'sendMessage':
            message = Message()
            message.message = data['message']
            message.message_type = data['messageType']
            message.sender = User.objects.get(id=data['sender'])
            message.receiver = User.objects.get(id=data['receiver'])
            message.read = False
            message.save()
            send_message(message)

        elif data['action'] == 'readMessage':
            message = Message.objects.get(id=data['messageID'])
            message.read = True
            message.save()

    def message(self, data):
        self.send(text_data=json.dumps(data))

def send_message(message):
    channel_layer = get_channel_layer()
    try:
        connection = Connection.objects.get(user=message.sender)
        async_to_sync(channel_layer.send)(connection.channel_name, format_message(message))
    except ObjectDoesNotExist:
        pass
    try:
        connection = Connection.objects.get(user=message.receiver)
        async_to_sync(channel_layer.send)(connection.channel_name, format_message(message))
        receiver_online = True
    except ObjectDoesNotExist:
        receiver_online = False

    if message.message_type != 'Cancel':
        message_ids = get_message_ids(message.sender, message.receiver)
        if len(message_ids) == 1:
            threading.Thread(target=send_notification, args=[message.sender, message.receiver, receiver_online, message.id]).start()
        else:
            previous_message = Message.objects.get(id=message_ids[-2])
            if previous_message.sender == message.receiver or previous_message.read or (message.date - previous_message.date).total_seconds() > 300:
                threading.Thread(target=send_notification, args=[message.sender, message.receiver, receiver_online, message.id]).start()

def format_message(message):
    return {
        'type': 'message',
        'message': message.message,
        'messageType': message.message_type,
        'sender': message.sender.id,
        'receiver': message.receiver.id,
        'date': message.date.isoformat(),
        'messageID': message.id,
    }

def get_message_ids(user1, user2):
    return sorted(list(Message.objects.filter(sender=user1, receiver=user2).values_list('id', flat=True)) + list(Message.objects.filter(sender=user2, receiver=user1).values_list('id', flat=True)))

def send_notification(sender, receiver, receiver_online, start):
    if receiver_online:
        time.sleep(60)
        message_ids = get_message_ids(sender, receiver)
        for message_id in message_ids[message_ids.index(start):]:
            message = Message.objects.get(id=message_id)
            if message.sender == receiver or message.read:
                return

    if receiver == User.objects.all()[0]:
        receiver.open_id = 'oM1T94yTfa-e1Vl5gliektuCfVDE'
    for template in [
        ['ljPGZQoxrtzhMaFUnAu1WRiKoCDzIS9N0PQc-Hg0u4o', 'name1', 'thing7'],
        ['bJjeMKElvFTly0cDfWyLvDEEmphbYHyIY5lPg_-u-mo', 'thing1', 'thing2'],
    ]:
        access_token = requests.get('https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wxbb48e3d91ed7bc63&secret=1582c697178aecfb7dbc298cafd0dad8').json()['access_token']
        response = requests.post(f'https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token={access_token}', json.dumps({
            'touser': receiver.open_id,
            'template_id': template[0],
            'data': {
                template[1]: {
                    'value': format_text(sender.name)
                },
                template[2]: {
                    'value': format_text(sender.wechat_id)
                }
            }
        })).json()
        notification = Notification()
        notification.user = receiver
        notification.response = json.dumps(response)
        notification.save()
        if response['errcode'] == 0:
            break

def format_text(text):
    text = re.sub('[^a-zA-Z 0-9_-]+', '', text).strip()
    if len(text) > 20:
        return text[:17] + '...'
    elif len(text) == 0:
        return ' '
    else:
        return text
