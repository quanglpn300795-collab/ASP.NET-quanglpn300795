using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace SimAuctionMVC.Models
{
    public class ApplicationUser : IdentityUser
    {
        [StringLength(100)]
        public string? FullName { get; set; }
        
        public decimal Balance { get; set; } = 0;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual ICollection<Bid> Bids { get; set; } = new List<Bid>();
        public virtual ICollection<SimCard> WonSims { get; set; } = new List<SimCard>();
    }
}