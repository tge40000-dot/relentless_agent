"""
Lead Generation Workflow
Orchestrates real lead scraping, scoring, and job management
"""

import asyncio
import json
import os
import requests
from datetime import datetime
from typing import Dict, List

JOB_MANAGER_URL = os.getenv("JOB_MANAGER_URL", "http://127.0.0.1:8001")


class LeadGenerationWorkflow:
    def __init__(self):
        self.job_manager_url = JOB_MANAGER_URL

    def create_job(self, job_type: str, target_market: str, criteria: Dict) -> Dict:
        try:
            payload = {
                "type": job_type,
                "target_market": target_market,
                "criteria": criteria,
                "created_at": datetime.now().isoformat(),
                "status": "pending",
            }
            response = requests.post(f"{self.job_manager_url}/jobs", json=payload, timeout=5)
            if response.status_code == 200:
                return response.json()
            else:
                print(f"✗ Failed to create job: {response.text}")
                return {"success": False, "error": response.text}
        except Exception as e:
            print(f"✗ Error creating job: {e}")
            return {"success": False, "error": str(e)}

    def execute_lead_generation(self, job_id: str, target_market: str, criteria: Dict) -> Dict:
        """Execute lead generation using real web scraper"""
        print(f"\n🎯 Starting lead generation for: {target_market}")
        leads = asyncio.run(self._scrape_and_qualify(target_market, criteria))
        result = {
            "success": True,
            "job_id": job_id,
            "leads_found": len(leads),
            "leads": leads,
            "timestamp": datetime.now().isoformat(),
        }
        self._update_job_results(job_id, result)
        return result

    async def _scrape_and_qualify(self, target_market: str, criteria: Dict) -> List[Dict]:
        """Scrape real leads and qualify them"""
        try:
            from web_scraper import legal_scraper
            raw_leads = await legal_scraper.scrape_all_sources(target_market, criteria)
            # Use rule-based scoring to avoid sklearn dependency
            scored = self._rule_based_score_leads(raw_leads)
            qualified = [l for l in scored if l.get("score", 0) >= 30]
            return sorted(qualified, key=lambda x: x.get("score", 0), reverse=True)[:50]
        except Exception as e:
            print(f"✗ Scrape/qualify error: {e}")
            return []

    def _rule_based_score_leads(self, leads: List[Dict]) -> List[Dict]:
        """Simple rule-based scoring without ML dependencies"""
        scored = []
        for lead in leads:
            score = 50
            if lead.get("email"):
                score += 15
            if lead.get("phone"):
                score += 10
            if lead.get("website"):
                score += 10
            lead["score"] = min(100, score)
            scored.append(lead)
        return scored

    def _update_job_results(self, job_id: str, result: Dict):
        try:
            requests.put(f"{self.job_manager_url}/jobs/{job_id}", json=result, timeout=5)
        except Exception as e:
            print(f"✗ Failed to update job {job_id}: {e}")

    def run_campaign(self, target_market: str, criteria: Dict = None) -> Dict:
        """Full campaign: create job → scrape → qualify → return results"""
        criteria = criteria or {}
        job = self.create_job("lead_generation", target_market, criteria)
        job_id = job.get("id", "local")
        return self.execute_lead_generation(job_id, target_market, criteria)


workflow = LeadGenerationWorkflow()

if __name__ == "__main__":
    result = workflow.run_campaign("singles 25 and up", {"min_age": "25"})
    print(f"\n✓ Leads found: {result['leads_found']}")
    for lead in result["leads"][:5]:
        print(f"  🏢 {lead.get('company')} — Score: {lead.get('score', 0)}")
