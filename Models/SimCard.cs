using System.ComponentModel.DataAnnotations;

namespace SimAuctionMVC.Models
{
    public class SimCard
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        
        [Required]
        [StringLength(15)]
        public string Number { get; set; } = string.Empty;
        
        [Required]
        public string Network { get; set; } = string.Empty;
        
        [Required]
        public decimal StartingPrice { get; set; }
        
        [Required]
        public decimal CurrentPrice { get; set; }
        
        public decimal? BuyNowPrice { get; set; }
        
        [Range(1, 5)]
        public int BeautyScore { get; set; }
        
        [Required]
        public string Category { get; set; } = string.Empty;
        
        public string? Description { get; set; }
        
        [Required]
        public SimStatus Status { get; set; } = SimStatus.Draft;
        
        [Required]
        public DateTime StartTime { get; set; }
        
        [Required]
        public DateTime EndTime { get; set; }
        
        public int TotalBids { get; set; } = 0;
        
        public string? WinnerId { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual ICollection<Bid> Bids { get; set; } = new List<Bid>();
        public virtual ApplicationUser? Winner { get; set; }
    }

    public enum SimStatus
    {
        Draft,
        Active,
        Ended,
        Sold
    }
}