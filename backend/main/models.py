from django.db import models
from django.utils import timezone
import json

class User(models.Model):
    date = models.DateTimeField(default=timezone.now)
    open_id = models.TextField()
    name = models.CharField(max_length=50)
    account_type = models.CharField(max_length=10)
    wechat_id = models.TextField()
    profile_picture_URL = models.TextField()
    profile_picture_file = models.CharField(max_length=25)
    payment_code_file = models.CharField(max_length=25)
    def __str__(self):
        return self.name if self.name else 'Anonymous'

class Connection(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    channel_name = models.TextField()
    def __str__(self):
        return str(self.user)

class Item(models.Model):
    date = models.DateTimeField(default=timezone.now)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    category = models.CharField(max_length=20)
    name = models.CharField(max_length=50)
    subject = models.CharField(max_length=100)
    isbn = models.CharField(max_length=13)
    condition = models.CharField(max_length=15)
    images = models.TextField()
    def __str__(self):
        return f'{self.user} - {self.name}'

class Product(models.Model):
    date = models.DateTimeField(default=timezone.now)
    date_modified = models.DateTimeField(default=timezone.now)
    name = models.CharField(max_length=50)
    seller = models.ForeignKey(User, on_delete=models.CASCADE, related_name='seller')
    buyer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='buyer', null=True)
    items = models.TextField()
    images = models.TextField()
    price = models.IntegerField()
    additional_information = models.TextField()
    status = models.CharField(max_length=30)
    def __str__(self):
        return f'{self.status} - {self.seller} - {self.buyer} - {self.name}'

class Reservation(models.Model):
    date = models.DateTimeField(default=timezone.now)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)

class Message(models.Model):
    date = models.DateTimeField(default=timezone.now)
    message = models.TextField()
    message_type = models.CharField(max_length=20)
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sender')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='receiver')
    read = models.BooleanField()

class Bookmark(models.Model):
    date = models.DateTimeField(default=timezone.now)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    def __str__(self):
        return f'{self.user} - {self.product.name}'

class Session(models.Model):
    date = models.DateTimeField(default=timezone.now)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    status = models.CharField(max_length=15)
    def __str__(self):
        return f'{timezone.localtime(self.date).strftime("%m/%d/%Y %H:%M:%S")} | {self.user} - {self.status}'

class Notification(models.Model):
    date = models.DateTimeField(default=timezone.now)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    response = models.TextField()
    def __str__(self):
        return f'{timezone.localtime(self.date).strftime("%m/%d/%Y %H:%M:%S")} | {self.user} - {"Success" if json.loads(self.response)["errcode"] == 0 else "Fail"}'
