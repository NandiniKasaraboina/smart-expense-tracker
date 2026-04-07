
from django.db import models
from django.contrib.auth.models import User


class Expenses(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=100)
    amount = models.FloatField()
    category = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)

    month = models.IntegerField(null=True, blank=True)  # ✅ ADDED

