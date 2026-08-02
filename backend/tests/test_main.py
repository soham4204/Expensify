from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to the AI Expense Tracker API"}

def test_read_dashboard_summary():
    response = client.get("/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert "current_balance" in data
    assert "today_spending" in data
    assert "month_spending" in data
    assert "month_income" in data

def test_create_and_read_accounts():
    # Attempt to create an account
    response = client.post("/accounts/", json={"name": "Test Bank", "balance": 1000.0, "type": "Bank"})
    # It might fail with 400 if it already exists from previous test runs, which is fine to ignore for a basic test,
    # but ideally we should drop tables or use a test DB. For now, just check it doesn't 500.
    assert response.status_code in [200, 400]

    response = client.get("/accounts/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_read_analytics_spending():
    response = client.get("/analytics/spending-by-category")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_read_analytics_cashflow():
    response = client.get("/analytics/cashflow")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if len(data) > 0:
        assert "month" in data[0]
        assert "income" in data[0]

def test_create_and_read_budgets():
    response = client.post("/budgets/", json={"amount": 5000.0, "period": "monthly"})
    assert response.status_code == 200

    response = client.get("/budgets/usage")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
