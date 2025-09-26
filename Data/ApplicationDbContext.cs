using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using SimAuctionMVC.Models;

namespace SimAuctionMVC.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<SimCard> SimCards { get; set; }
        public DbSet<Bid> Bids { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // SimCard configuration
            builder.Entity<SimCard>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Number).IsRequired().HasMaxLength(15);
                entity.Property(e => e.Network).IsRequired();
                entity.Property(e => e.Category).IsRequired();
                entity.Property(e => e.StartingPrice).HasColumnType("decimal(18,2)");
                entity.Property(e => e.CurrentPrice).HasColumnType("decimal(18,2)");
                entity.Property(e => e.BuyNowPrice).HasColumnType("decimal(18,2)");
                
                entity.HasOne(e => e.Winner)
                    .WithMany(u => u.WonSims)
                    .HasForeignKey(e => e.WinnerId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // Bid configuration
            builder.Entity<Bid>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Amount).HasColumnType("decimal(18,2)");
                
                entity.HasOne(e => e.SimCard)
                    .WithMany(s => s.Bids)
                    .HasForeignKey(e => e.SimCardId)
                    .OnDelete(DeleteBehavior.Cascade);
                
                entity.HasOne(e => e.User)
                    .WithMany(u => u.Bids)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // ApplicationUser configuration
            builder.Entity<ApplicationUser>(entity =>
            {
                entity.Property(e => e.Balance).HasColumnType("decimal(18,2)");
            });
        }
    }
}