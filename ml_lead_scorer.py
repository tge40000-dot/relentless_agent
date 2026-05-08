"""
ML-Based Lead Scoring System
Uses machine learning to predict lead quality and conversion probability
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, mean_squared_error
import joblib
import os
from datetime import datetime
from typing import List, Dict, Tuple
import json

class MLLeadScorer:
    """
    Machine learning lead scorer that predicts:
    - Lead quality score (0-100)
    - Conversion probability (0-1)
    - Recommended action
    """
    
    def __init__(self):
        self.quality_model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.conversion_model = GradientBoostingRegressor(n_estimators=100, random_state=42)
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        self.is_trained = False
        self.model_path = "models/lead_scorer.pkl"
        
        # Load existing model if available
        if os.path.exists(self.model_path):
            self.load_model()
    
    def prepare_features(self, lead: Dict) -> np.ndarray:
        """Extract features from lead data"""
        features = []
        
        # Numerical features
        features.append(len(lead.get("company", "")))  # Company name length
        features.append(len(lead.get("description", "")))  # Description length
        features.append(len(lead.get("email", "")) > 0)  # Has email
        features.append(len(lead.get("phone", "")) > 0)  # Has phone
        features.append(len(lead.get("website", "")) > 0)  # Has website
        
        # Revenue range (encoded)
        revenue_ranges = {
            "Unknown": 0,
            "<$1M": 1,
            "$1M-$5M": 2,
            "$5M-$10M": 3,
            "$10M-$50M": 4,
            "$50M-$100M": 5,
            "$100M-$500M": 6,
            "$500M-$1B": 7,
            ">$1B": 8
        }
        features.append(revenue_ranges.get(lead.get("revenue_range", "Unknown"), 0))
        
        # Employee count (encoded)
        employee_ranges = {
            "Unknown": 0,
            "1-10": 1,
            "11-50": 2,
            "51-200": 3,
            "201-500": 4,
            "501-1000": 5,
            "1001-5000": 6,
            "5000+": 7
        }
        features.append(employee_ranges.get(lead.get("employee_count", "Unknown"), 0))
        
        # Source quality (encoded)
        source_quality = {
            "linkedin": 0.8,
            "crunchbase": 0.9,
            "yelp": 0.6,
            "google_business": 0.7,
            "industry_directory": 0.5,
            "referral": 0.95,
            "website": 0.85,
            "clutch": 0.88,
            "g2": 0.85
        }
        features.append(source_quality.get(lead.get("source", ""), 0.5))
        
        # Industry relevance (encoded)
        high_value_industries = [
            "technology", "software", "saas", "fintech", "healthtech",
            "biotech", "ecommerce", "manufacturing", "consulting"
        ]
        industry = lead.get("industry", "").lower()
        features.append(1 if any(ind in industry for ind in high_value_industries) else 0)
        
        # Market fit
        market = lead.get("market", "").lower()
        target_markets = ["technology", "startup", "business", "enterprise"]
        features.append(1 if any(m in market for m in target_markets) else 0)
        
        # Intent signals (high-ROI features)
        features.append(1.0 if lead.get("budget_confirmed") or lead.get("budget") else 0.0)
        timeline = lead.get("timeline", "").lower()
        features.append(1.0 if any(w in timeline for w in ["asap", "urgent", "immediate", "this week"]) else 0.5 if timeline else 0.0)
        role = lead.get("role", "").lower()
        features.append(1.0 if any(t in role for t in ["ceo", "cto", "founder", "owner", "vp", "director"]) else 0.3 if role else 0.0)
        features.append(1.0 if lead.get("referred_by") or lead.get("source") == "referral" else 0.0)
        features.append(1.0 if lead.get("repeat_visitor") or lead.get("previous_interaction") else 0.0)
        
        return np.array([features])
    
    def train(self, historical_data: List[Dict]):
        """Train models on historical lead data"""
        if len(historical_data) < 10:
            print("⚠️  Not enough data to train (need at least 10 samples)")
            return
        
        # Prepare training data
        X = []
        y_quality = []
        y_conversion = []
        
        for lead in historical_data:
            features = self.prepare_features(lead)[0]
            X.append(features)
            y_quality.append(lead.get("quality_score", 50))
            y_conversion.append(lead.get("conversion_probability", 0.5))
        
        X = np.array(X)
        
        # Scale features
        X_scaled = self.scaler.fit_transform(X)
        
        # Train quality model
        y_quality_classes = [1 if score >= 70 else 0 for score in y_quality]
        self.quality_model.fit(X_scaled, y_quality_classes)
        
        # Train conversion model
        self.conversion_model.fit(X_scaled, y_conversion)
        
        self.is_trained = True
        print("✓ ML models trained successfully")
        
        # Save model
        self.save_model()
    
    def score_lead(self, lead: Dict) -> Dict:
        """Score a single lead using ML models"""
        if not self.is_trained:
            # Use rule-based scoring if model not trained
            return self._rule_based_score(lead)
        
        # Prepare features
        features = self.prepare_features(lead)
        features_scaled = self.scaler.transform(features)
        
        # Predict quality (high/low)
        quality_pred = self.quality_model.predict(features_scaled)[0]
        quality_prob = self.quality_model.predict_proba(features_scaled)[0]
        
        # Predict conversion probability
        conversion_pred = self.conversion_model.predict(features_scaled)[0]
        
        # Calculate final score
        base_score = 50
        if quality_pred == 1:
            base_score += 30
        base_score += int(conversion_pred * 20)
        
        # Add rule-based adjustments
        score = self._apply_rule_adjustments(lead, base_score)
        
        # Determine tier
        if score >= 80:
            tier = "Hot"
        elif score >= 60:
            tier = "Warm"
        elif score >= 40:
            tier = "Cold"
        else:
            tier = "Unqualified"
        
        # Generate recommendation
        recommendation = self._generate_recommendation(lead, score, tier)
        
        return {
            "lead": lead,
            "score": min(100, max(0, score)),
            "tier": tier,
            "conversion_probability": min(1.0, max(0.0, conversion_pred)),
            "quality_probability": quality_prob[1] if quality_pred == 1 else quality_prob[0],
            "recommendation": recommendation,
            "scored_at": datetime.now().isoformat(),
            "method": "ml" if self.is_trained else "rule_based"
        }
    
    def score_leads(self, leads: List[Dict]) -> List[Dict]:
        """Score multiple leads"""
        scored_leads = []
        
        for lead in leads:
            scored = self.score_lead(lead)
            scored_leads.append(scored)
        
        # Sort by score (highest first)
        scored_leads.sort(key=lambda x: x["score"], reverse=True)
        
        return scored_leads
    
    def _rule_based_score(self, lead: Dict) -> Dict:
        """Fallback rule-based scoring"""
        score = 50
        
        # Contact information
        if lead.get("email"):
            score += 15
        if lead.get("phone"):
            score += 10
        if lead.get("website"):
            score += 10
        
        # Company size
        revenue = lead.get("revenue_range", "")
        if "$5M" in revenue or "$10M" in revenue:
            score += 10
        elif "$50M" in revenue or "$100M" in revenue:
            score += 15
        elif "$500M" in revenue or "$1B" in revenue:
            score += 20
        
        # Source quality
        source = lead.get("source", "")
        if source == "crunchbase":
            score += 15
        elif source == "linkedin":
            score += 12
        elif source == "referral":
            score += 20
        elif source == "clutch":
            score += 13
        elif source == "g2":
            score += 12
        
        # Industry
        industry = lead.get("industry", "").lower()
        high_value = ["technology", "software", "saas", "fintech", "ecommerce", "consulting", "healthtech"]
        if any(hv in industry for hv in high_value):
            score += 10
        
        # Intent signals (high-ROI)
        if lead.get("budget_confirmed") or lead.get("budget"):
            score += 20
        timeline = lead.get("timeline", "").lower()
        if any(w in timeline for w in ["asap", "urgent", "immediate", "this week"]):
            score += 15
        elif timeline:
            score += 5
        role = lead.get("role", "").lower()
        if any(t in role for t in ["ceo", "cto", "founder", "owner", "vp", "director"]):
            score += 15
        elif any(t in role for t in ["manager", "lead"]):
            score += 7
        if lead.get("referred_by"):
            score += 10
        if lead.get("repeat_visitor") or lead.get("previous_interaction"):
            score += 10
        
        # Determine tier
        if score >= 80:
            tier = "Hot"
        elif score >= 60:
            tier = "Warm"
        elif score >= 40:
            tier = "Cold"
        else:
            tier = "Unqualified"
        
        return {
            "lead": lead,
            "score": min(100, max(0, score)),
            "tier": tier,
            "conversion_probability": score / 100,
            "quality_probability": 0.5,
            "recommendation": self._generate_recommendation(lead, score, tier),
            "scored_at": datetime.now().isoformat(),
            "method": "rule_based"
        }
    
    def _apply_rule_adjustments(self, lead: Dict, base_score: int) -> int:
        """Apply rule-based adjustments to ML score"""
        score = base_score
        
        # Boost for complete contact info
        if lead.get("email") and lead.get("phone") and lead.get("website"):
            score += 5
        
        # Boost for recent activity
        if lead.get("last_contact"):
            try:
                last_contact = datetime.fromisoformat(lead["last_contact"])
                days_since = (datetime.now() - last_contact).days
                if days_since < 7:
                    score += 10
                elif days_since < 30:
                    score += 5
            except (ValueError, TypeError):
                pass  # Skip if date is invalid
        
        return score
    
    def _generate_recommendation(self, lead: Dict, score: int, tier: str) -> str:
        """Generate action recommendation"""
        if tier == "Hot":
            return "Immediate outreach - high conversion probability"
        elif tier == "Warm":
            return "Priority outreach - good potential"
        elif tier == "Cold":
            return "Nurture campaign - add to drip sequence"
        else:
            return "Disqualify - low fit"
    
    def save_model(self):
        """Save trained models to disk"""
        os.makedirs("models", exist_ok=True)
        
        model_data = {
            "quality_model": self.quality_model,
            "conversion_model": self.conversion_model,
            "scaler": self.scaler,
            "is_trained": self.is_trained
        }
        
        try:
            joblib.dump(model_data, self.model_path)
            print(f"✓ Model saved to {self.model_path}")
        except Exception as e:
            print(f"✗ Error saving model: {e}")
            raise
    
    def load_model(self):
        """Load trained models from disk"""
        try:
            model_data = joblib.load(self.model_path)
            self.quality_model = model_data["quality_model"]
            self.conversion_model = model_data["conversion_model"]
            self.scaler = model_data["scaler"]
            self.is_trained = model_data["is_trained"]
            print(f"✓ Model loaded from {self.model_path}")
        except Exception as e:
            print(f"✗ Error loading model: {e}")
            self.is_trained = False

# Singleton instance
ml_scorer = MLLeadScorer()

if __name__ == "__main__":
    # Test ML lead scorer
    print("Testing ML Lead Scorer...")
    
    test_leads = [
        {
            "company": "Tech Startup Inc",
            "industry": "Technology",
            "source": "crunchbase",
            "email": "contact@techstartup.com",
            "phone": "555-0100",
            "website": "https://techstartup.com",
            "revenue_range": "$5M-$10M",
            "employee_count": "51-200",
            "market": "technology"
        },
        {
            "company": "Small Business LLC",
            "industry": "Retail",
            "source": "yelp",
            "email": "",
            "phone": "555-0101",
            "website": "",
            "revenue_range": "Unknown",
            "employee_count": "1-10",
            "market": "local"
        }
    ]
    
    scored = ml_scorer.score_leads(test_leads)
    
    print(f"\n📊 Lead Scoring Results:")
    for result in scored:
        print(f"\n🏢 {result['lead']['company']}")
        print(f"   Score: {result['score']}/100")
        print(f"   Tier: {result['tier']}")
        print(f"   Conversion Probability: {result['conversion_probability']:.2%}")
        print(f"   Recommendation: {result['recommendation']}")
