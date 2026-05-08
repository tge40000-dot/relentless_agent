"""
Revenue Tracker — Pipeline Analytics Engine
Tracks conversion at each stage, pipeline velocity, win/loss by source,
and writes daily snapshots for the dashboard and atomic optimization.
"""

import json
import os
from datetime import datetime, timedelta
from typing import Dict, List


class RevenueTracker:
    def __init__(self):
        self.analytics_file = "logs/pipeline_analytics.json"
        self.snapshots: List[Dict] = []
        self._load()

    def _load(self):
        try:
            if os.path.exists(self.analytics_file):
                with open(self.analytics_file, "r") as f:
                    self.snapshots = json.load(f)
        except Exception:
            self.snapshots = []

    def _save(self):
        os.makedirs("logs", exist_ok=True)
        try:
            with open(self.analytics_file, "w") as f:
                json.dump(self.snapshots[-200:], f, indent=2, default=str)
        except Exception as e:
            print(f"[TRACKER] Save error: {e}")

    def record_snapshot(self, conversations: Dict, sales_stats: Dict = None, source_performance: Dict = None):
        stages = {"lead": 0, "outreach": 0, "follow_up": 0, "proposal": 0, "closed": 0, "lost": 0}
        by_source = {}
        by_tier = {}
        by_industry = {}
        velocity_data = []
        now = datetime.now()

        for lead_id, conv in conversations.items():
            stage = conv.get("stage", "outreach")
            stages[stage] = stages.get(stage, 0) + 1
            src = conv.get("source", "unknown")
            by_source.setdefault(src, {"total": 0, "closed": 0, "lost": 0, "revenue": 0})
            by_source[src]["total"] += 1
            if stage == "closed":
                by_source[src]["closed"] += 1
                by_source[src]["revenue"] += conv.get("deal_value", 0)
            elif stage == "lost":
                by_source[src]["lost"] += 1
            tier = conv.get("tier", "Unknown")
            by_tier[tier] = by_tier.get(tier, 0) + 1
            industry = conv.get("lead", {}).get("industry", "Unknown")
            by_industry.setdefault(industry, {"total": 0, "closed": 0})
            by_industry[industry]["total"] += 1
            if stage == "closed":
                by_industry[industry]["closed"] += 1
            first_touch = conv.get("first_touch")
            closed_at = conv.get("closed_at")
            if first_touch and closed_at:
                try:
                    days = (datetime.fromisoformat(closed_at) - datetime.fromisoformat(first_touch)).total_seconds() / 86400
                    velocity_data.append(days)
                except:
                    pass

        total = sum(stages.values()) or 1
        conversion_rates = {
            "lead_to_outreach": (stages.get("outreach", 0) + stages.get("follow_up", 0) + stages.get("proposal", 0) + stages.get("closed", 0)) / total * 100,
            "outreach_to_proposal": (stages.get("proposal", 0) + stages.get("closed", 0)) / max(1, stages.get("outreach", 0) + stages.get("follow_up", 0) + stages.get("proposal", 0) + stages.get("closed", 0)) * 100,
            "proposal_to_close": stages.get("closed", 0) / max(1, stages.get("proposal", 0) + stages.get("closed", 0)) * 100,
            "overall_win_rate": stages.get("closed", 0) / total * 100,
        }

        source_roi = []
        for src, data in by_source.items():
            win_rate = data["closed"] / max(1, data["total"]) * 100
            source_roi.append({"source": src, "leads": data["total"], "closed": data["closed"],
                                "lost": data["lost"], "revenue": data["revenue"], "win_rate": round(win_rate, 1)})
        source_roi.sort(key=lambda x: x["revenue"], reverse=True)

        snapshot = {
            "timestamp": now.isoformat(),
            "pipeline_stages": stages,
            "conversion_rates": conversion_rates,
            "by_source": source_roi,
            "by_tier": by_tier,
            "by_industry": by_industry,
            "avg_days_to_close": round(sum(velocity_data) / len(velocity_data), 1) if velocity_data else 0,
            "total_pipeline_value": sum(conv.get("deal_value", 0) for conv in conversations.values() if conv.get("stage") == "closed"),
            "total_active": len(conversations),
            "sales_stats": sales_stats or {},
        }
        self.snapshots.append(snapshot)
        self._save()
        return snapshot

    def get_latest(self) -> Dict:
        return self.snapshots[-1] if self.snapshots else {}

    def get_trend(self, days: int = 7) -> List[Dict]:
        cutoff = (datetime.now() - timedelta(days=days)).isoformat()
        return [s for s in self.snapshots if s.get("timestamp", "") >= cutoff]

    def get_source_roi_summary(self) -> List[Dict]:
        return self.get_latest().get("by_source", [])

    def get_conversion_funnel(self) -> Dict:
        latest = self.get_latest()
        return {"stages": latest.get("pipeline_stages", {}), "rates": latest.get("conversion_rates", {}), "velocity": latest.get("avg_days_to_close", 0)}


revenue_tracker = RevenueTracker()
