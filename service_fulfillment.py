"""
Service Fulfillment Automation
Automates the delivery of all Relentless Billionaire services
"""

import asyncio
import json
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from web_scraper import legal_scraper
from ml_lead_scorer import ml_scorer
from openai_content import openai_generator
from sendgrid_email import sendgrid_email

class ServiceFulfillment:
    """
    Automated service fulfillment system that:
    - Generates deliverables
    - Performs research
    - Creates content
    - Manages projects
    - Ensures quality
    """
    
    def __init__(self):
        self.services = {
            "svc_lead_generation": {
                "name": "Lead Generation",
                "description": "Generate qualified leads for your business",
                "deliverables": ["lead_list", "contact_info", "qualification_scores"],
                "duration_hours": 24
            },
            "svc_crm_intake": {
                "name": "CRM Setup & Intake",
                "description": "Set up CRM and customer intake automation",
                "deliverables": ["crm_config", "intake_workflow", "automation_rules"],
                "duration_hours": 48
            },
            "svc_crm_scoring": {
                "name": "Lead Scoring System",
                "description": "Implement ML-based lead scoring",
                "deliverables": ["scoring_model", "integration", "reporting"],
                "duration_hours": 72
            },
            "svc_flyer_production": {
                "name": "Marketing Flyer Production",
                "description": "Create professional marketing materials",
                "deliverables": ["flyer_design", "copy", "variations"],
                "duration_hours": 12
            },
            "svc_outreach": {
                "name": "Outreach Campaign",
                "description": "Execute targeted outreach campaigns",
                "deliverables": ["email_sequences", "follow_up_schedule", "analytics"],
                "duration_hours": 168  # 1 week
            }
        }
        
        self.active_projects = {}
        self.completed_projects = []
    
    async def fulfill_service(self, job: Dict) -> Dict:
        """Fulfill a service job automatically"""
        service_id = job.get('service_id')
        
        if service_id not in self.services:
            return {"error": f"Unknown service: {service_id}"}
        
        service = self.services[service_id]
        customer = job.get('customer_email')
        
        print(f"\n🎯 Fulfilling Service: {service['name']}")
        print(f"👤 Customer: {customer}")
        
        # Create project
        project_id = f"proj_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        project = {
            "id": project_id,
            "service_id": service_id,
            "service_name": service['name'],
            "customer": customer,
            "job_id": job.get('id'),
            "status": "in_progress",
            "started_at": datetime.now().isoformat(),
            "progress": 0,
            "deliverables": {},
            "estimated_completion": self._estimate_completion(service['duration_hours'])
        }
        
        self.active_projects[project_id] = project
        
        # Execute service fulfillment
        try:
            if service_id == "svc_lead_generation":
                await self._fulfill_lead_generation(project, job)
            elif service_id == "svc_flyer_production":
                await self._fulfill_flyer_production(project, job)
            elif service_id == "svc_outreach":
                await self._fulfill_outreach_campaign(project, job)
            else:
                await self._fulfill_generic_service(project, job)
            
            # Mark as complete
            project['status'] = 'completed'
            project['completed_at'] = datetime.now().isoformat()
            project['progress'] = 100
            
            # Move to completed
            self.completed_projects.append(project)
            del self.active_projects[project_id]
            
            # Send completion notification
            await self._send_completion_notification(project)
            
            print(f"✓ Service fulfilled: {service['name']}")
            return project
            
        except Exception as e:
            project['status'] = 'failed'
            project['error'] = str(e)
            print(f"✗ Service fulfillment failed: {e}")
            return project
    
    async def _fulfill_lead_generation(self, project: Dict, job: Dict):
        """Fulfill lead generation service"""
        metadata = job.get('metadata', {})
        target_market = metadata.get('target_market', 'technology startups')
        
        print(f"🔍 Generating leads for: {target_market}")
        
        # Step 1: Scrape leads
        project['progress'] = 20
        leads = await legal_scraper.scrape_all_sources(target_market)
        
        # Step 2: Score leads
        project['progress'] = 50
        from ml_lead_scorer import ml_scorer
        scored_leads = ml_scorer.score_leads(leads)
        
        # Step 3: Filter top leads
        project['progress'] = 80
        top_leads = [l for l in scored_leads if l['tier'] in ['Hot', 'Warm']][:50]
        
        # Create deliverable
        deliverable = {
            "lead_list": top_leads,
            "total_found": len(leads),
            "qualified_count": len(top_leads),
            "generated_at": datetime.now().isoformat()
        }
        
        project['deliverables']['lead_list'] = deliverable
        print(f"✓ Generated {len(top_leads)} qualified leads")
    
    async def _fulfill_flyer_production(self, project: Dict, job: Dict):
        """Fulfill flyer production service"""
        metadata = job.get('metadata', {})
        business_info = metadata.get('business_info', {})
        campaign_goal = metadata.get('campaign_goal', 'Lead Generation')
        
        print(f"🎨 Creating marketing flyer")
        
        # Generate flyer content
        project['progress'] = 40
        flyer_content = openai_generator.generate_flyer_content(business_info, campaign_goal)
        
        # Generate variations
        project['progress'] = 70
        variations = []
        
        for i in range(3):
            variation = flyer_content.copy()
            variation['headline'] = f"{variation['headline']} (Variation {i+1})"
            variations.append(variation)
        
        # Create deliverable
        deliverable = {
            "primary_content": flyer_content,
            "variations": variations,
            "created_at": datetime.now().isoformat()
        }
        
        project['deliverables']['flyer_design'] = deliverable
        print(f"✓ Created flyer with {len(variations)} variations")
    
    async def _fulfill_outreach_campaign(self, project: Dict, job: Dict):
        """Fulfill outreach campaign service"""
        metadata = job.get('metadata', {})
        target_leads = metadata.get('target_leads', [])
        
        print(f"✉️  Creating outreach campaign")
        
        # Generate email sequences
        project['progress'] = 30
        email_sequences = []
        
        for i, lead in enumerate(target_leads[:10]):
            sequence = {
                "lead": lead,
                "emails": []
            }
            
            # Initial outreach
            email1 = openai_generator.generate_outreach_email(lead, "Revenue Generation")
            sequence['emails'].append({
                "sequence": 1,
                "content": email1,
                "send_after": "0 days"
            })
            
            # Follow-up
            email2 = f"""
            Subject: Following up - {lead.get('company', 'your company')}
            
            Hi {lead.get('contact', 'there')},
            
            I wanted to follow up on my previous email.
            
            Have you had a chance to consider our revenue generation services?
            
            Best regards,
            Relentless Billionaire Team
            """
            sequence['emails'].append({
                "sequence": 2,
                "content": email2,
                "send_after": "3 days"
            })
            
            email_sequences.append(sequence)
            project['progress'] = 30 + (i * 5)
        
        # Create follow-up schedule
        project['progress'] = 80
        schedule = {
            "campaign_duration": "30 days",
            "touchpoints": 5,
            "frequency": "every 3-5 days"
        }
        
        # Create deliverable
        deliverable = {
            "email_sequences": email_sequences,
            "follow_up_schedule": schedule,
            "analytics_config": {
                "track_opens": True,
                "track_clicks": True,
                "track_conversions": True
            },
            "created_at": datetime.now().isoformat()
        }
        
        project['deliverables']['outreach_campaign'] = deliverable
        print(f"✓ Created outreach campaign for {len(email_sequences)} leads")
    
    async def _fulfill_generic_service(self, project: Dict, job: Dict):
        """Fulfill generic service with research and content"""
        metadata = job.get('metadata', {})
        
        print(f"📋 Fulfilling generic service")
        
        # Perform research
        project['progress'] = 30
        research = await self._perform_research(metadata)
        
        # Generate content
        project['progress'] = 60
        content = await self._generate_service_content(metadata, research)
        
        # Create deliverable
        project['progress'] = 90
        deliverable = {
            "research": research,
            "content": content,
            "recommendations": self._generate_recommendations(metadata),
            "created_at": datetime.now().isoformat()
        }
        
        project['deliverables']['generic_service'] = deliverable
        print(f"✓ Generic service fulfilled")
    
    async def _perform_research(self, metadata: Dict) -> Dict:
        """Perform research for service"""
        # Simulate research (in production, use real research)
        return {
            "market_analysis": "Market shows strong demand",
            "competitor_analysis": "5 main competitors identified",
            "opportunity_analysis": "Clear opportunities in niche segments",
            "researched_at": datetime.now().isoformat()
        }
    
    async def _generate_service_content(self, metadata: Dict, research: Dict) -> str:
        """Generate content for service"""
        topic = metadata.get('topic', 'Business Growth')
        return openai_generator.generate_blog_post(topic, "Entrepreneurs", "medium")
    
    def _generate_recommendations(self, metadata: Dict) -> List[str]:
        """Generate recommendations"""
        return [
            "Focus on high-value customer segments",
            "Implement automated follow-up sequences",
            "Leverage community for referrals",
            "Track key performance metrics"
        ]
    
    def _estimate_completion(self, duration_hours: int) -> str:
        """Estimate completion time"""
        completion = datetime.now() + timedelta(hours=duration_hours)
        return completion.isoformat()
    
    async def _send_completion_notification(self, project: Dict):
        """Send completion notification to customer"""
        customer = project['customer']
        service_name = project['service_name']
        
        content = f"""
        Your {service_name} service has been completed!
        
        Project ID: {project['id']}
        Service: {service_name}
        Completed: {project['completed_at']}
        
        Deliverables:
        {', '.join(project['deliverables'].keys())}
        
        You can access your deliverables through your dashboard.
        
        Thank you for choosing Relentless Billionaire!
        
        Best regards,
        Relentless Billionaire Team
        """
        
        if customer:
            sendgrid_email.send_email(
                customer,
                f"Service Completed: {service_name}",
                content,
                content
            )
    
    def get_project_status(self, project_id: str) -> Optional[Dict]:
        """Get status of a project"""
        if project_id in self.active_projects:
            return self.active_projects[project_id]
        
        for project in self.completed_projects:
            if project['id'] == project_id:
                return project
        
        return None
    
    def get_all_projects(self, status: str = None) -> List[Dict]:
        """Get all projects, optionally filtered by status"""
        projects = []
        
        if status is None or status == 'in_progress':
            projects.extend(self.active_projects.values())
        
        if status is None or status == 'completed':
            projects.extend(self.completed_projects)
        
        if status:
            projects = [p for p in projects if p['status'] == status]
        
        return projects

# Singleton instance
service_fulfillment = ServiceFulfillment()

if __name__ == "__main__":
    async def test():
        print("Testing Service Fulfillment...")
        
        test_job = {
            "id": "test-job-123",
            "service_id": "svc_flyer_production",
            "customer_email": "test@example.com",
            "metadata": {
                "business_info": {
                    "name": "Growth Campaign",
                    "industry": "Technology"
                },
                "campaign_goal": "Lead Generation"
            }
        }
        
        result = await service_fulfillment.fulfill_service(test_job)
        print(f"\n✅ Service Fulfillment Result:")
        print(f"Status: {result['status']}")
        print(f"Progress: {result['progress']}%")
        print(f"Deliverables: {list(result['deliverables'].keys())}")
    
    asyncio.run(test())
