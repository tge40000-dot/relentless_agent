"""
Revenue Manager - Bootstrap Mode
Tracks revenue and manages 10% reinvestment budget with user approval
"""

import os
import json
from datetime import datetime
from typing import Dict, List, Optional
from dataclasses import dataclass
from enum import Enum

class ScalingStatus(Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    COMPLETED = "completed"

@dataclass
class Transaction:
    id: str
    amount: float
    customer_email: str
    service_id: str
    date: str
    tier_id: Optional[str] = None
    discount: float = 0.0
    status: str = "completed"
    source: str = "direct"
    days_to_close: float = 0.0

@dataclass
class ScalingProposal:
    id: str
    type: str  # "infrastructure", "marketing", "hiring", "tools"
    description: str
    cost: float
    roi_estimate: float
    proposed_date: str
    status: ScalingStatus = ScalingStatus.PENDING
    approved_by: Optional[str] = None
    approved_date: Optional[str] = None

class RevenueManager:
    """
    Manages revenue tracking and 10% reinvestment budget
    - Tracks all transactions
    - Calculates 10% reinvestment budget
    - Requires user approval for scaling
    - Operates in bootstrap mode initially
    """
    
    def __init__(self):
        self.transactions_file = "data/transactions.json"
        self.proposals_file = "data/scaling_proposals.json"
        self.transactions: List[Transaction] = []
        self.proposals: List[ScalingProposal] = []
        self.reinvestment_percentage = 0.10  # 10% reinvestment
        self.bootstrapping_mode = True  # Start in bootstrap mode
        
        # Load existing data
        self._load_data()
    
    def _load_data(self):
        """Load transactions and proposals from disk"""
        os.makedirs("data", exist_ok=True)
        
        try:
            if os.path.exists(self.transactions_file):
                with open(self.transactions_file, 'r') as f:
                    data = json.load(f)
                    self.transactions = [Transaction(**t) for t in data]
        except (json.JSONDecodeError, Exception) as e:
            print(f"[ERROR] Loading transactions: {e}")
            self.transactions = []
        
        try:
            if os.path.exists(self.proposals_file):
                with open(self.proposals_file, 'r') as f:
                    data = json.load(f)
                    self.proposals = [ScalingProposal(**p) for p in data]
        except (json.JSONDecodeError, Exception) as e:
            print(f"[ERROR] Loading proposals: {e}")
            self.proposals = []
    
    def _save_data(self):
        """Save transactions and proposals to disk"""
        try:
            with open(self.transactions_file, 'w') as f:
                json.dump([t.__dict__ for t in self.transactions], f, indent=2)
        except Exception as e:
            print(f"[ERROR] Saving transactions: {e}")
        
        try:
            with open(self.proposals_file, 'w') as f:
                json.dump([p.__dict__ for p in self.proposals], f, indent=2)
        except Exception as e:
            print(f"[ERROR] Saving proposals: {e}")
    
    def record_transaction(self, amount: float, customer_email: str, service_id: str, tier_id: Optional[str] = None, source: str = "direct", days_to_close: float = 0.0) -> Transaction:
        """Record a new transaction with optional membership tier and source tracking"""
        if amount <= 0:
            raise ValueError(f"Transaction amount must be positive, got {amount}")
        
        transaction = Transaction(
            id=f"txn_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            amount=amount,
            customer_email=customer_email,
            service_id=service_id,
            date=datetime.now().isoformat(),
            tier_id=tier_id,
            discount=0.0,
            source=source,
            days_to_close=days_to_close
        )
        
        self.transactions.append(transaction)
        self._save_data()
        
        tier_info = f" [{tier_id}]" if tier_id else ""
        print(f"[REVENUE] Transaction recorded: ${amount:,.2f} from {customer_email}{tier_info}")
        return transaction
    
    def get_total_revenue(self) -> float:
        """Get total revenue from all transactions"""
        return sum(t.amount for t in self.transactions)
    
    def get_monthly_revenue(self) -> float:
        """Get revenue for current month"""
        current_month = datetime.now().strftime('%Y-%m')
        return sum(
            t.amount for t in self.transactions 
            if t.date.startswith(current_month)
        )
    
    def get_reinvestment_budget(self) -> float:
        """Calculate 10% reinvestment budget from total revenue"""
        total_revenue = self.get_total_revenue()
        budget = total_revenue * self.reinvestment_percentage
        return budget
    
    def get_spent_budget(self) -> float:
        """Get amount already spent on scaling"""
        return sum(
            p.cost for p in self.proposals 
            if p.status == ScalingStatus.COMPLETED
        )
    
    def get_available_budget(self) -> float:
        """Get available budget for new scaling proposals"""
        return self.get_reinvestment_budget() - self.get_spent_budget()
    
    def propose_scaling(self, scaling_type: str, description: str, cost: float, roi_estimate: float) -> ScalingProposal:
        """Create a new scaling proposal for user approval"""
        if cost <= 0:
            raise ValueError(f"Proposal cost must be positive, got {cost}")
        
        available_budget = self.get_available_budget()
        
        if cost > available_budget:
            print(f"[WARNING] Proposal cost (${cost:,.2f}) exceeds available budget (${available_budget:,.2f})")
        
        proposal = ScalingProposal(
            id=f"prop_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            type=scaling_type,
            description=description,
            cost=cost,
            roi_estimate=roi_estimate,
            proposed_date=datetime.now().isoformat(),
            status=ScalingStatus.PENDING
        )
        
        self.proposals.append(proposal)
        self._save_data()
        
        print(f"[SCALING] New proposal created: {description} (${cost:,.2f})")
        return proposal
    
    def approve_proposal(self, proposal_id: str, approver: str) -> bool:
        """Approve a scaling proposal"""
        for proposal in self.proposals:
            if proposal.id == proposal_id and proposal.status == ScalingStatus.PENDING:
                proposal.status = ScalingStatus.APPROVED
                proposal.approved_by = approver
                proposal.approved_date = datetime.now().isoformat()
                self._save_data()
                
                print(f"[APPROVED] Proposal {proposal_id} approved by {approver}")
                return True
        
        print(f"[ERROR] Proposal {proposal_id} not found or not pending")
        return False
    
    def reject_proposal(self, proposal_id: str, approver: str) -> bool:
        """Reject a scaling proposal"""
        for proposal in self.proposals:
            if proposal.id == proposal_id and proposal.status == ScalingStatus.PENDING:
                proposal.status = ScalingStatus.REJECTED
                proposal.approved_by = approver
                proposal.approved_date = datetime.now().isoformat()
                self._save_data()
                
                print(f"[REJECTED] Proposal {proposal_id} rejected by {approver}")
                return True
        
        print(f"[ERROR] Proposal {proposal_id} not found or not pending")
        return False
    
    def mark_proposal_completed(self, proposal_id: str) -> bool:
        """Mark a proposal as completed (after implementation)"""
        for proposal in self.proposals:
            if proposal.id == proposal_id and proposal.status == ScalingStatus.APPROVED:
                proposal.status = ScalingStatus.COMPLETED
                self._save_data()
                
                print(f"[COMPLETED] Proposal {proposal_id} marked as completed")
                return True
        
        print(f"[ERROR] Proposal {proposal_id} not found or not approved")
        return False
    
    def get_pending_proposals(self) -> List[ScalingProposal]:
        """Get all pending proposals"""
        return [p for p in self.proposals if p.status == ScalingStatus.PENDING]
    
    def get_revenue_report(self) -> Dict:
        """Generate comprehensive revenue report"""
        return {
            "total_revenue": self.get_total_revenue(),
            "monthly_revenue": self.get_monthly_revenue(),
            "reinvestment_percentage": self.reinvestment_percentage * 100,
            "total_reinvestment_budget": self.get_reinvestment_budget(),
            "spent_budget": self.get_spent_budget(),
            "available_budget": self.get_available_budget(),
            "total_transactions": len(self.transactions),
            "pending_proposals": len(self.get_pending_proposals()),
            "bootstrapping_mode": self.bootstrapping_mode,
            "revenue_by_tier": self.get_revenue_by_tier(),
            "revenue_by_source": self.get_revenue_by_source(),
            "revenue_by_service": self.get_revenue_by_service(),
            "generated_at": datetime.now().isoformat()
        }
    
    def get_revenue_by_tier(self) -> Dict:
        """Get revenue breakdown by membership tier for optimization"""
        tier_revenue = {
            "no_tier": 0,
            "tier-starter": 0,
            "tier-pro": 0,
            "tier-elite": 0
        }
        tier_count = {
            "no_tier": 0,
            "tier-starter": 0,
            "tier-pro": 0,
            "tier-elite": 0
        }
        
        for t in self.transactions:
            tier = t.tier_id if t.tier_id else "no_tier"
            tier_revenue[tier] += t.amount
            tier_count[tier] += 1
        
        return {
            "revenue": tier_revenue,
            "count": tier_count,
            "average_order_value": {
                tier: (tier_revenue[tier] / tier_count[tier] if tier_count[tier] > 0 else 0)
                for tier in tier_revenue.keys()
            }
        }
    
    def get_revenue_by_source(self) -> Dict:
        """Get revenue breakdown by lead source for ROI optimization"""
        source_revenue = {}
        source_count = {}
        source_days = {}
        
        for t in self.transactions:
            src = getattr(t, 'source', 'direct') or 'direct'
            source_revenue[src] = source_revenue.get(src, 0) + t.amount
            source_count[src] = source_count.get(src, 0) + 1
            dtc = getattr(t, 'days_to_close', 0) or 0
            source_days.setdefault(src, []).append(dtc)
        
        return {
            "revenue": source_revenue,
            "count": source_count,
            "average_order_value": {
                src: (source_revenue[src] / source_count[src] if source_count[src] > 0 else 0)
                for src in source_revenue.keys()
            },
            "avg_days_to_close": {
                src: (sum(source_days[src]) / len(source_days[src]) if source_days.get(src) else 0)
                for src in source_revenue.keys()
            },
            "roi_rank": sorted(source_revenue.keys(), key=lambda s: source_revenue[s], reverse=True)
        }

    def get_revenue_by_service(self) -> Dict:
        """Get revenue breakdown by service for optimization"""
        service_revenue = {}
        service_count = {}
        
        for t in self.transactions:
            service = t.service_id
            service_revenue[service] = service_revenue.get(service, 0) + t.amount
            service_count[service] = service_count.get(service, 0) + 1
        
        return {
            "revenue": service_revenue,
            "count": service_count,
            "average_order_value": {
                service: (service_revenue[service] / service_count[service] if service_count[service] > 0 else 0)
                for service in service_revenue.keys()
            }
        }
    
    def print_revenue_report(self):
        """Print formatted revenue report"""
        report = self.get_revenue_report()
        
        print("\n" + "=" * 60)
        print("REVENUE & REINVESTMENT REPORT")
        print("=" * 60)
        print(f"Total Revenue: ${report['total_revenue']:,.2f}")
        print(f"Monthly Revenue: ${report['monthly_revenue']:,.2f}")
        print(f"Total Transactions: {report['total_transactions']}")
        print("")
        print(f"Reinvestment Rate: {report['reinvestment_percentage']:.0f}%")
        print(f"Total Budget: ${report['total_reinvestment_budget']:,.2f}")
        print(f"Spent: ${report['spent_budget']:,.2f}")
        print(f"Available: ${report['available_budget']:,.2f}")
        print(f"Pending Proposals: {report['pending_proposals']}")
        print(f"Mode: {'BOOTSTRAP' if report['bootstrapping_mode'] else 'SCALING'}")
        print("=" * 60)
    
    def exit_bootstrap_mode(self, approver: str) -> bool:
        """Exit bootstrap mode and enable scaling (requires approval)"""
        if self.get_total_revenue() < 10000:
            print(f"[WARNING] Revenue below $10,000 threshold. Current: ${self.get_total_revenue():,.2f}")
            return False
        
        self.bootstrapping_mode = False
        print(f"[INFO] Bootstrap mode exited by {approver}. Scaling enabled.")
        return True

# Singleton instance
revenue_manager = RevenueManager()

if __name__ == "__main__":
    # Test revenue manager
    print("Testing Revenue Manager (Bootstrap Mode)...")
    
    # Record some transactions
    revenue_manager.record_transaction(500, "customer1@example.com", "svc_lead_generation")
    revenue_manager.record_transaction(1000, "customer2@example.com", "svc_flyer_design")
    revenue_manager.record_transaction(2000, "customer3@example.com", "svc_consulting")
    
    # Print report
    revenue_manager.print_revenue_report()
    
    # Create scaling proposals
    revenue_manager.propose_scaling(
        "infrastructure",
        "Upgrade to cloud hosting",
        200,
        500
    )
    
    revenue_manager.propose_scaling(
        "marketing",
        "Facebook ads campaign",
        150,
        1000
    )
    
    # Show pending proposals
    print("\nPending Proposals:")
    for prop in revenue_manager.get_pending_proposals():
        print(f"  - {prop.description}: ${prop.cost:,.2f} (ROI: ${prop.roi_estimate:,.2f})")
    
    print("\n[INFO] All scaling requires user approval before execution.")
