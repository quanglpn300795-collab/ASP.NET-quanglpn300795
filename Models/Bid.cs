using System.ComponentModel.DataAnnotations;

namespace SimAuctionMVC.Models
{
    public class Bid
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        
        [Required]
        public string SimCardId { get; set; } = string.Empty;
        
        [Required]
        public string UserId { get; set; } = string.Empty;
        
        [Required]
        public decimal Amount { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual SimCard SimCard { get; set; } = null!;
        public virtual ApplicationUser User { get; set; } = null!;
    }
}