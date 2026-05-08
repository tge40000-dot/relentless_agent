"""
OpenAI Content Generation
AI-powered content creation for marketing, outreach, and service fulfillment
"""

import os
import json
from typing import Dict, List, Optional
from datetime import datetime
from dotenv import load_dotenv

try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    print("⚠️  OpenAI not installed. Using template fallbacks.")

load_dotenv(override=True)

class OpenAIContentGenerator:
    """
    AI content generator using Groq (Llama 3.3 70B) - free, fast, accurate
    Creates marketing content, outreach messages, and service deliverables
    """
    
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY") or os.getenv("OPENAI_API_KEY")
        self.model = os.getenv("AI_MODEL", "llama-3.3-70b-versatile")
        self.base_url = os.getenv("AI_BASE_URL", "https://api.groq.com/openai/v1")
        self.client = None
        
        if OPENAI_AVAILABLE and self.api_key:
            try:
                self.client = openai.OpenAI(
                    api_key=self.api_key,
                    base_url=self.base_url
                )
                print("[OK] Groq AI client initialized (Llama 3.3 70B - free)")
            except Exception as e:
                print(f"[ERROR] Groq initialization failed: {e}")
        else:
            print("[WARNING] AI not configured - add GROQ_API_KEY to .env")
    
    def generate_outreach_email(self, lead: Dict, service: str, custom_context: str = None) -> str:
        """Generate personalized outreach email"""
        prompt = f"""
        Generate a professional, personalized outreach email for a potential B2B customer.
        
        Company: {lead.get('company', 'Unknown')}
        Industry: {lead.get('industry', 'Unknown')}
        Contact: {lead.get('contact', 'Decision Maker')}
        
        Service: {service}
        Company Mission: Relentless Billionaire - Building a community to help entrepreneurs succeed through revenue generation and business growth services.
        
        {custom_context if custom_context else ''}
        
        Requirements:
        - Professional and respectful tone
        - Personalized to their industry
        - Clear value proposition
        - Call to action for discovery call
        - Maximum 200 words
        - No sales pressure
        """
        
        if self.client:
            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": "You are a professional B2B sales consultant helping businesses grow."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=300,
                    temperature=0.7
                )
                return response.choices[0].message.content.strip()
            except Exception as e:
                print(f"✗ OpenAI error: {e}")
                return self._fallback_outreach_email(lead, service)
        else:
            return self._fallback_outreach_email(lead, service)
    
    def generate_flyer_content(self, business_info: Dict, campaign_goal: str) -> Dict:
        """Generate marketing flyer content"""
        prompt = f"""
        Generate compelling marketing flyer content.
        
        Business: {business_info.get('name', 'Unknown')}
        Industry: {business_info.get('industry', 'Unknown')}
        Target Audience: {business_info.get('target_audience', 'General')}
        Campaign Goal: {campaign_goal}
        
        Company: Relentless Billionaire - Helping entrepreneurs build successful businesses through revenue generation and community support.
        
        Generate:
        1. Attention-grabbing headline (max 10 words)
        2. Subheadline (max 15 words)
        3. Key benefits (3 bullet points)
        4. Call to action (max 10 words)
        5. Tagline (max 15 words)
        
        Format as JSON with keys: headline, subheadline, benefits, call_to_action, tagline
        """
        
        if self.client:
            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": "You are a professional marketing copywriter."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=400,
                    temperature=0.8
                )
                content = response.choices[0].message.content.strip()
                
                # Try to parse as JSON
                try:
                    return json.loads(content)
                except:
                    return self._fallback_flyer_content(business_info, campaign_goal)
            except Exception as e:
                print(f"✗ OpenAI error: {e}")
                return self._fallback_flyer_content(business_info, campaign_goal)
        else:
            return self._fallback_flyer_content(business_info, campaign_goal)
    
    def generate_social_media_post(self, topic: str, platform: str = "linkedin") -> str:
        """Generate social media post"""
        platform_specs = {
            "linkedin": {"max_length": 3000, "tone": "professional"},
            "twitter": {"max_length": 280, "tone": "casual"},
            "facebook": {"max_length": 63206, "tone": "engaging"},
            "instagram": {"max_length": 2200, "tone": "visual"}
        }
        
        spec = platform_specs.get(platform, platform_specs["linkedin"])
        
        prompt = f"""
        Generate a {spec['tone']} social media post for {platform}.
        
        Topic: {topic}
        Company: Relentless Billionaire - Building a community of successful entrepreneurs through revenue generation and business growth.
        
        Requirements:
        - {spec['tone']} tone
        - Engaging and shareable
        - Include relevant hashtags
        - Maximum {spec['max_length']} characters
        - Include call to action
        """
        
        if self.client:
            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": f"You are a social media expert for {platform}."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=500,
                    temperature=0.8
                )
                return response.choices[0].message.content.strip()
            except Exception as e:
                print(f"✗ OpenAI error: {e}")
                return self._fallback_social_post(topic, platform)
        else:
            return self._fallback_social_post(topic, platform)
    
    def generate_blog_post(self, topic: str, target_audience: str, length: str = "medium") -> str:
        """Generate blog post"""
        length_specs = {
            "short": 500,
            "medium": 1000,
            "long": 2000
        }
        
        target_length = length_specs.get(length, 1000)
        
        prompt = f"""
        Generate a comprehensive blog post.
        
        Topic: {topic}
        Target Audience: {target_audience}
        Company: Relentless Billionaire - Helping entrepreneurs build successful businesses
        
        Requirements:
        - Professional and informative
        - Actionable insights
        - Clear structure with headings
        - Approximately {target_length} words
        - SEO-friendly
        - Include introduction and conclusion
        """
        
        if self.client:
            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": "You are a business consultant and content writer."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=2000,
                    temperature=0.7
                )
                return response.choices[0].message.content.strip()
            except Exception as e:
                print(f"✗ OpenAI error: {e}")
                return self._fallback_blog_post(topic)
        else:
            return self._fallback_blog_post(topic)
    
    def generate_service_proposal(self, lead: Dict, service: str, budget: str) -> str:
        """Generate service proposal"""
        prompt = f"""
        Generate a professional service proposal.
        
        Client: {lead.get('company', 'Unknown')}
        Industry: {lead.get('industry', 'Unknown')}
        Service: {service}
        Budget Range: {budget}
        
        Company: Relentless Billionaire - Revenue generation and business growth services
        
        Requirements:
        - Executive summary
        - Problem statement
        - Proposed solution
        - Deliverables
        - Timeline
        - Pricing structure
        - Next steps
        - Professional tone
        """
        
        if self.client:
            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": "You are a business consultant writing proposals."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=1500,
                    temperature=0.6
                )
                return response.choices[0].message.content.strip()
            except Exception as e:
                print(f"✗ OpenAI error: {e}")
                return self._fallback_proposal(lead, service)
        else:
            return self._fallback_proposal(lead, service)
    
    def generate_community_content(self, topic: str, content_type: str = "discussion") -> str:
        """Generate community-building content"""
        prompt = f"""
        Generate engaging community content.
        
        Topic: {topic}
        Content Type: {content_type}
        Community: Relentless Billionaire - Entrepreneurs helping each other succeed through revenue generation
        
        Requirements:
        - Foster discussion and engagement
        - Share valuable insights
        - Encourage community participation
        - Supportive and collaborative tone
        - Include question for community
        """
        
        if self.client:
            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": "You are a community manager fostering entrepreneurship."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=500,
                    temperature=0.8
                )
                return response.choices[0].message.content.strip()
            except Exception as e:
                print(f"✗ OpenAI error: {e}")
                return self._fallback_community_content(topic)
        else:
            return self._fallback_community_content(topic)
    
    # Fallback methods when OpenAI is not available
    def _fallback_outreach_email(self, lead: Dict, service: str) -> str:
        return f"""
        Subject: Helping {lead.get('company', 'your company')} grow
        
        Hi {lead.get('contact', 'there')},
        
        I came across {lead.get('company', 'your company')} and was impressed by what you're building in the {lead.get('industry', 'industry')} space.
        
        At Relentless Billionaire, we help entrepreneurs like you accelerate revenue growth through our {service} services. Our community of successful entrepreneurs has generated over $10M in combined revenue using our proven strategies.
        
        Would you be open to a 15-minute discovery call to discuss how we might help you achieve your growth goals?
        
        Best regards,
        Relentless Billionaire Team
        """
    
    def _fallback_flyer_content(self, business_info: Dict, campaign_goal: str) -> Dict:
        return {
            "headline": "Accelerate Your Business Growth",
            "subheadline": "Proven strategies for entrepreneurs",
            "benefits": [
                "Generate more revenue",
                "Build a successful business",
                "Join a supportive community"
            ],
            "call_to_action": "Start Your Journey Today",
            "tagline": "Relentless Billionaire - Your Path to Success"
        }
    
    def _fallback_social_post(self, topic: str, platform: str) -> str:
        return f"""
        {topic}
        
        At Relentless Billionaire, we're helping entrepreneurs achieve their goals through proven revenue generation strategies. Join our community and start building your success today.
        
        #entrepreneurship #businessgrowth #revenue #success
        
        Learn more at relentlessbillionaire.com
        """
    
    def _fallback_blog_post(self, topic: str) -> str:
        return f"""
        # {topic}
        
        At Relentless Billionaire, we believe every entrepreneur deserves the tools and support to build a successful business. In this post, we'll explore key strategies for growth.
        
        ## Understanding the Challenge
        Building a business is challenging. But with the right approach, success is achievable.
        
        ## Proven Strategies
        1. Focus on revenue generation
        2. Build a strong network
        3. Leverage community support
        4. Invest in continuous learning
        
        ## Taking Action
        Start implementing these strategies today and join our community of successful entrepreneurs.
        
        ---
        Relentless Billionaire - Building successful entrepreneurs through community and revenue generation.
        """
    
    def _fallback_proposal(self, lead: Dict, service: str) -> str:
        return f"""
        # Service Proposal for {lead.get('company', 'Client')}
        
        ## Executive Summary
        We propose to provide {service} services to help {lead.get('company', 'your company')} achieve its growth objectives.
        
        ## Solution
        Our proven approach has helped numerous businesses accelerate their revenue growth.
        
        ## Deliverables
        - Comprehensive analysis
        - Strategic recommendations
        - Implementation support
        - Ongoing optimization
        
        ## Next Steps
        Let's schedule a call to discuss how we can help you achieve your goals.
        
        ---
        Relentless Billionaire Team
        """
    
    def _fallback_community_content(self, topic: str) -> str:
        return f"""
        {topic}
        
        What's been your biggest challenge in building your business? Share your experience and let's learn from each other. Our community is here to support your journey to success.
        
        #community #entrepreneurship #growth
        
        What strategies have worked for you?
        """

# Singleton instance
openai_generator = OpenAIContentGenerator()

if __name__ == "__main__":
    # Test OpenAI content generator
    print("Testing OpenAI Content Generator...")
    
    # Test outreach email
    test_lead = {
        "company": "Tech Startup Inc",
        "industry": "Technology",
        "contact": "John Smith"
    }
    
    email = openai_generator.generate_outreach_email(test_lead, "Revenue Generation")
    print(f"\n📧 Outreach Email:\n{email}")
    
    # Test flyer content
    flyer = openai_generator.generate_flyer_content(
        {"name": "Growth Campaign", "industry": "Technology"},
        "Lead Generation"
    )
    print(f"\n📄 Flyer Content:\n{json.dumps(flyer, indent=2)}")
