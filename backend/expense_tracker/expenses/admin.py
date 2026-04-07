from django.contrib import admin
from .models import Expenses   # or Expense (based on your class)

admin.site.register(Expenses)