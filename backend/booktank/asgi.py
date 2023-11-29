"""
ASGI config for booktank project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/3.0/howto/deployment/asgi/
"""

import os

from channels.routing import ProtocolTypeRouter, URLRouter
from django.urls import path
from main import consumers

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'booktank.settings')

application = ProtocolTypeRouter({
    'websocket': URLRouter([
        path('', consumers.Consumer),
    ])
})
