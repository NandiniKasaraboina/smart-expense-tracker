
from django.http import JsonResponse
from .models import Expenses
import json
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.views.decorators.csrf import csrf_exempt
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .models import Expenses
# from openai import OpenAI
# from django.conf import settings #to access our api key

from google import genai
from django.conf import settings
import os
import requests
from django.http import JsonResponse
from collections import defaultdict



# 🔐 GENERATE TOKEN
def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return str(refresh.access_token)


# 🔐 REGISTER
@csrf_exempt
def register(request):
    if request.method == "POST":
        data = json.loads(request.body)

        username = data.get("username")
        password = data.get("password")

        if not username or not password:
            return JsonResponse({"error": "Missing fields"})

        if User.objects.filter(username=username).exists():
            return JsonResponse({"error": "User already exists"})

        User.objects.create_user(username=username, password=password)

        return JsonResponse({"message": "User created"})

    return JsonResponse({"error": "Only POST allowed"})


# 🔐 LOGIN
@csrf_exempt
def login(request):
    if request.method == "POST":
        data = json.loads(request.body)

        user = authenticate(
            username=data.get("username"),
            password=data.get("password")
        )

        if user:
            token = get_tokens_for_user(user)
            return JsonResponse({"token": token})
        else:
            return JsonResponse({"error": "Invalid credentials"})

    return JsonResponse({"error": "Only POST allowed"})


# 🔹 GET EXPENSES
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_expenses(request):
    expenses = Expenses.objects.filter(user=request.user)
    data = list(expenses.values())
    return JsonResponse(data, safe=False)


# 🔹 ADD EXPENSE (✅ FIXED)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_expense(request):
    data = request.data

    Expenses.objects.create(
        user=request.user,
        title=data.get("title"),
        amount=data.get("amount"),
        category=data.get("category"),
        month=data.get("month")   # ✅ IMPORTANT FIX
    )

    return JsonResponse({"message": "Added successfully"})


# 🔹 DELETE
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def delete_expense(request, id):
    try:
        expense = Expenses.objects.get(id=id, user=request.user)
        expense.delete()
        return JsonResponse({"message": "Deleted successfully"})
    except Expenses.DoesNotExist:
        return JsonResponse({"error": "Not found"}, status=404)


# 🔹 UPDATE (✅ FIXED)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_expense(request, id):
    try:
        expense = Expenses.objects.get(id=id, user=request.user)

        data = request.data

        expense.title = data.get("title")
        expense.amount = data.get("amount")
        expense.category = data.get("category")

        # ✅ ADD THIS LINE
        if "month" in data:
            expense.month = data.get("month")

        expense.save()

        return JsonResponse({"message": "Updated successfully"})

    except Expenses.DoesNotExist:
        return JsonResponse({"error": "Not found"}, status=404)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def ai_insight(request):

    expenses = Expenses.objects.filter(user=request.user)

    # ✅ Handle empty case
    if not expenses.exists():
        return JsonResponse({"message": "No expenses found."})

    category_totals = defaultdict(int)

    for exp in expenses:
        category_totals[exp.category] += exp.amount

    # ✅ Safe max
    if not category_totals:
        return JsonResponse({"message": "No categories found."})

    top_category = max(category_totals, key=category_totals.get)

    ai_message = f"You spend most on {top_category}. Try reducing expenses in this category."

    # ✅ ALWAYS return
    return JsonResponse({"message": ai_message})



# @api_view(['GET'])
# @permission_classes([IsAuthenticated])
# def ai_insight(request):

#     #get all expenses of loggedin user
#     expenses = Expenses.objects.filter(user=request.user)

#     #convert db into json
#     data = list(expenses.values())


#     #converrt expenses into readable text
#     expense_text = ""
#     for exp in expenses:
#         expense_text+= f"{exp.category}:{exp.amount}\n"

#     #craete ai prompt
#     prompt = f"""
#     Analyze the following expenses:
#     {expense_text}
#     Tell which category the user spends the most on and give me a short suggestion.
#     """

#     # # openai.api_key = settings.OPENAI_API_KEY
#     # client = OpenAI(api_key=settings.OPENAI_API_KEY)

#     # #sends reuest to openai
#     # response = client.chat.completions.create(
#     #     model = "gpt-3.5-turbo",
#     #     messages = [
#     #         {"role":"user","content": prompt}
#     #     ]
#     # )
#     # ai_message = response['chocies'][0].message.content


#     #add gemini 
#     # #connect ur app to gemini
#     # genai.configure(api_key = settings.GEMINI_API_KEY)

#     # # #selects which ai model to use
#     # model = genai.GenerativeModel("gemini-pro")

#     # # #send ur prompt to gemini
#     # response = model.generate_content(prompt)

#     # # #extract ai answer from response
#     # ai_message = response.text

#     # # #return data
#     # return JsonResponse({"message":ai_message})


#     genai.configure(api_key=settings.GEMINI_API_KEY)

#     model = genai.GenerativeModel("gemini-pro")

#     response = model.generate_content(prompt)

#     ai_message = response.text

#     return JsonResponse({"message": ai_message})





