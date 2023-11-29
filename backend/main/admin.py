from django.contrib import admin
from .models import *

for model in [User, Connection, Item, Product, Bookmark, Session, Notification]:
    admin.site.register(model)
