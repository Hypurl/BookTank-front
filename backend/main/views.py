from django.views.decorators.csrf import csrf_exempt
from django.shortcuts import redirect
from django.http import JsonResponse
from django.core.exceptions import ObjectDoesNotExist
from django.utils import timezone
from django.conf import settings
from .consumers import send_message
from .models import *
import json
import requests
import time
import os

if settings.DEBUG:
    static = 'main/static/'
else:
    static = '/home/ubuntu/static/'

@csrf_exempt
def index(request):
    if request.method == 'GET':
        return redirect('static/qr-code.html')
    elif request.FILES:
        file = static + request.POST.get('directory') + list(request.FILES)[0]
        with open(file, 'wb+') as destination:
            for chunk in list(request.FILES.values())[0].chunks():
                destination.write(chunk)
        # access_token = requests.get('https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wxbb48e3d91ed7bc63&secret=1582c697178aecfb7dbc298cafd0dad8').json()['access_token']
        # response = requests.post(f'https://api.weixin.qq.com/wxa/img_sec_check?access_token={access_token}', files={'': open(file, 'rb')}).json()
        # if response['errcode'] != 0:
        #     os.system(f'rm {file}')
        # else:
        compressed_file = f'{static}compressed-images/{list(request.FILES)[0]}'
        os.system(f'cp {file} {compressed_file}')
        os.system(f'jpegoptim --size=30k {compressed_file}')
        return JsonResponse({})

    data = json.loads(request.body)
    if 'userID' in data:
        user = User.objects.get(id=data['userID'])

    if data['action'] == 'getData':
        return JsonResponse({
            'users': get_users(),
            'products': get_products(),
            'items': get_items(),
            'messages': get_messages(user),
            'bookmarks': get_bookmarks(user),
            'reservations': get_reservations(user),
        })

    elif data['action'] == 'login':
        open_id = requests.get(f'https://api.weixin.qq.com/sns/jscode2session?appid=wxbb48e3d91ed7bc63&secret=1582c697178aecfb7dbc298cafd0dad8&js_code={data["code"]}&grant_type=authorization_code').json()['openid']
        try:
            user = User.objects.get(open_id=open_id)
        except ObjectDoesNotExist:
            user = User()
            user.open_id = open_id
            user.save()
            message = Message()
            message.message = 'Welcome to BookTank, a platform for students and parents to trade items, especially books, with ease. Here, you may browse through your favorite school books, contact the sellers and purchase in-app, all in one place! You may also sell your books and other items so that others around you may enjoy them through bookmarking and reserving. On behalf of the BookTank Team, we are here to make your experience at its proficiency. If you have any concerns, suggestions, or problems, please contact us. Thank you so much for your support and we hope this mini program could make your book trading process easier!\n\nDeveloped with ❤ by\nJason Qiu\nCindy Huang\nEric Kuo\nCandy Lu\nJhihYang Wu\nJeff Ou\nKatherine Chen'
            message.message_type = 'Text'
            message.sender = User.objects.all()[0]
            message.receiver = user
            message.read = True
            message.save()
        return JsonResponse({
            'userID': user.id,
        })

    elif data['action'] == 'register':
        user.name = filter_text(data['name'])
        user.account_type = data['accountType']
        user.wechat_id = filter_text(data['wechatID'])
        if data['URL'] != user.profile_picture_URL:
            file_name = str(int(time.time() * 1000)) + '.jpg'
            open(static + 'profile-pictures/' + file_name, 'wb').write(requests.get(data['URL']).content)
            user.profile_picture_URL = data['URL']
            user.profile_picture_file = file_name
        user.save()
        return JsonResponse({
            'profilePicture': user.profile_picture_file,
        })

    elif data['action'] == 'addItem':
        if 'edit' in data:
            item = Item.objects.get(id=data['edit'])
        else:
            try:
                Item.objects.get(images=json.dumps(data['images']))
                return JsonResponse({
                    'items': get_items(),
                })
            except ObjectDoesNotExist:
                pass
            item = Item()
        item.user = user
        item.category = data['category']
        item.name = filter_text(data['name'])
        item.subject = data['subject']
        item.isbn = data['isbn']
        item.condition = data['condition']
        item.images = json.dumps(data['images'])
        item.save()
        return JsonResponse({
            'items': get_items(),
        })

    elif data['action'] == 'deleteItems':
        for item_id in data['items']:
            try:
                Item.objects.get(id=item_id).delete()
            except ObjectDoesNotExist:
                pass
        return JsonResponse({
            'items': get_items(),
        })

    elif data['action'] == 'sell':
        try:
            Product.objects.get(items=json.dumps(data['items']))
            return JsonResponse({
                'users': get_users(),
                'products': get_products(),
                'items': get_items(),
            })
        except ObjectDoesNotExist:
            pass
        product = Product()
        product.name = filter_text(data['name'])
        product.seller = user
        product.items = json.dumps(data['items'])
        product.images = json.dumps(data['images'])
        product.price = data['price']
        product.additional_information = filter_text(data['additionalInformation'])
        product.status = 'Selling'
        product.save()
        return JsonResponse({
            'users': get_users(),
            'products': get_products(),
            'items': get_items(),
        })

    elif data['action'] == 'edit':
        product = Product.objects.get(id=data['productID'])
        product.name = filter_text(data['name'])
        product.price = data['price']
        product.additional_information = filter_text(data['additionalInformation'])
        product.save()
        return JsonResponse({
            'users': get_users(),
            'products': get_products(),
            'items': get_items(),
        })

    elif data['action'] == 'deleteProduct':
        try:
            Product.objects.get(id=data['productID'])
        except ObjectDoesNotExist:
            return JsonResponse({
                'users': get_users(),
                'products': get_products(),
                'items': get_items(),
            })
        product = Product.objects.get(id=data['productID'])
        if len(Message.objects.filter(message_type='Reserve', message=product.id)) == 0 and len(Bookmark.objects.filter(product=product)) == 0:
            product.delete()
        else:
            product.status = 'Deleted'
            product.save()
        return JsonResponse({
            'users': get_users(),
            'products': get_products(),
            'items': get_items(),
        })

    elif data['action'] == 'deleteProductCompletely':
        try:
            Product.objects.get(id=data['productID'])
        except ObjectDoesNotExist:
            return JsonResponse({
                'users': get_users(),
                'products': get_products(),
                'items': get_items(),
            })
        product = Product.objects.get(id=data['productID'])
        for item_id in json.loads(product.items):
            try:
                Item.objects.get(id=item_id).delete()
            except ObjectDoesNotExist:
                pass
        if len(Message.objects.filter(message_type='Reserve', message=product.id)) == 0 and len(Bookmark.objects.filter(product=product)) == 0:
            product.delete()
        else:
            product.status = 'Deleted'
            product.save()
        return JsonResponse({
            'users': get_users(),
            'products': get_products(),
            'items': get_items(),
        })

    elif data['action'] == 'cancelReservation':
        product = Product.objects.get(id=data['productID'])
        if product.status != 'Reserved':
            return JsonResponse({
                'users': get_users(),
                'products': get_products(),
                'items': get_items(),
                'reservations': get_reservations(user),
            })
        product.status = 'Selling'
        product.save()
        message = Message()
        message.message = data['productID']
        message.message_type = 'Cancel'
        message.sender = user
        message.receiver = product.buyer if product.seller == user else product.seller
        message.read = False
        message.save()
        send_message(message)
        if product.buyer == user:
            Reservation.objects.get(user=user, product=data['productID']).delete()
        product.date_modified = timezone.now()
        product.buyer = None
        product.save()
        return JsonResponse({
            'users': get_users(),
            'products': get_products(),
            'items': get_items(),
            'reservations': get_reservations(user),
        })

    elif data['action'] == 'deleteReservation':
        try:
            Reservation.objects.get(user=user, product=data['productID']).delete()
        except ObjectDoesNotExist:
            pass
        return JsonResponse({
            'reservations': get_reservations(user),
        })

    elif data['action'] == 'bookmark':
        try:
            Bookmark.objects.get(user=user, product=data['productID']).delete()
        except ObjectDoesNotExist:
            bookmark = Bookmark()
            bookmark.user = user
            bookmark.product = Product.objects.get(id=data['productID'])
            bookmark.save()
        return JsonResponse({
            'bookmarks': get_bookmarks(user),
        })

    elif data['action'] == 'deleteBookmark':
        try:
            Bookmark.objects.get(user=user, product=data['productID']).delete()
        except ObjectDoesNotExist:
            pass
        return JsonResponse({
            'bookmarks': get_bookmarks(user),
        })

    elif data['action'] == 'reserve':
        try:
            Product.objects.get(id=data['productID'])
        except ObjectDoesNotExist:
            return JsonResponse({
                'success': False,
                'users': get_users(),
                'products': get_products(),
                'items': get_items(),
            })
        product = Product.objects.get(id=data['productID'])
        if product.status != 'Selling':
            return JsonResponse({
                'success': False,
                'users': get_users(),
                'products': get_products(),
                'items': get_items(),
            })
        product.status = 'Reserved'
        product.save()
        message = Message()
        message.message = data['productID']
        message.message_type = 'Reserve'
        message.sender = user
        message.receiver = product.seller
        message.read = False
        message.save()
        send_message(message)
        product.date_modified = timezone.now()
        product.buyer = user
        product.save()
        try:
            Bookmark.objects.get(user=user, product=data['productID']).delete()
        except ObjectDoesNotExist:
            pass
        try:
            Reservation.objects.get(user=user, product=data['productID']).delete()
        except ObjectDoesNotExist:
            pass
        reservation = Reservation()
        reservation.user = user
        reservation.product = product
        reservation.save()
        return JsonResponse({
            'success': True,
            'users': get_users(),
            'products': get_products(),
            'items': get_items(),
            'bookmarks': get_bookmarks(user),
            'reservations': get_reservations(user),
        })

    elif data['action'] == 'setPaymentCode':
        user.payment_code_file = data['fileName']
        user.save()
        return JsonResponse({
            'users': get_users(),
        })

def get_users():
    users = {}
    for user in User.objects.all():
        users[user.id] = {
            'name': user.name,
            'identity': user.account_type,
            'wechatID': user.wechat_id,
            'profilePicture': user.profile_picture_file,
            'paymentCode': user.payment_code_file,
        }
    return users

def get_products():
    products = {}
    for product in Product.objects.all():
        products[product.id] = {
            'date': product.date,
            'dateModified': product.date_modified,
            'name': product.name,
            'seller': product.seller_id,
            'buyer': product.buyer_id,
            'items': json.loads(product.items),
            'images': json.loads(product.images),
            'price': product.price,
            'additionalInformation': product.additional_information,
            'status': product.status,
        }
    return products

def get_items():
    items = {}
    for item in Item.objects.all():
        items[item.id] = {
            'userID': item.user_id,
            'category': item.category,
            'name': item.name,
            'subject': item.subject,
            'isbn': item.isbn,
            'condition': item.condition,
            'images': json.loads(item.images),
        }
    return items

def get_messages(user):
    messages = {}
    for message_id in sorted(list(Message.objects.filter(sender=user).values_list('id', flat=True)) + list(Message.objects.filter(receiver=user).values_list('id', flat=True))):
        message = Message.objects.get(id=message_id)
        if message.sender == user:
            key = str(message.receiver_id)
        else:
            key = str(message.sender_id)
        if key not in messages:
            messages[key] = []
        messages[key].append([message.sender_id, message.message, message.message_type, message.date, message.read, message.id])
    return messages

def get_bookmarks(user):
    bookmarks = []
    for bookmark in Bookmark.objects.filter(user=user):
        bookmarks.append(bookmark.product_id)
    return bookmarks

def get_reservations(user):
    reservations = []
    for reservation in Reservation.objects.filter(user=user):
        reservations.append(reservation.product_id)
    return reservations

def filter_text(text):
    # access_token = requests.get('https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wxbb48e3d91ed7bc63&secret=1582c697178aecfb7dbc298cafd0dad8').json()['access_token']
    # response = json.loads(os.popen('curl -d \'{"content":"%s"}\' \'https://api.weixin.qq.com/wxa/msg_sec_check?access_token=%s\'' % (text.replace("'", '').replace('"', ''), access_token)).read())
    # if response['errcode'] == 87014:
    #     return '*' * len(text)
    return text
