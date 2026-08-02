import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from api.main import app

client = TestClient(app)

@patch("api.routers.ai.client")
def test_parse_transaction(mock_client):
    # Mock Gemini response
    mock_response = MagicMock()
    mock_response.text = '{"amount": 150.0, "merchant": "Starbucks", "category_name": "Food", "account_name": "Cash", "iso_date": "2026-08-02", "notes": "AI generated"}'
    mock_client.models.generate_content.return_value = mock_response

    response = client.post("/ai/parse-transaction", json={"text": "spent 150 on starbucks today"})
    
    # We might get 500 if the DB fails, but assuming DB is up, we should get 200
    assert response.status_code == 200
    data = response.json()
    assert data["amount"] == 150.0
    assert data["merchant"] == "Starbucks"

@patch("api.routers.ai.client")
def test_ai_chat(mock_client):
    mock_response = MagicMock()
    mock_response.text = "You have spent 500 this month."
    mock_client.models.generate_content.return_value = mock_response

    response = client.post("/ai/chat", json={"message": "How much did I spend this month?"})
    assert response.status_code == 200
    assert response.json()["reply"] == "You have spent 500 this month."
