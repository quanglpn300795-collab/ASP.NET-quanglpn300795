using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SimAuctionMVC.Data;
using SimAuctionMVC.Models;

namespace SimAuctionMVC.Controllers
{
    [Authorize]
    public class BidController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public BidController(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        [HttpPost]
        public async Task<IActionResult> PlaceBid(string SimCardId, decimal Amount)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return RedirectToAction("Login", "Account");
            }

            var simCard = await _context.SimCards.FindAsync(SimCardId);
            if (simCard == null || simCard.Status != SimStatus.Active)
            {
                TempData["Error"] = "Sim không tồn tại hoặc đã kết thúc đấu giá.";
                return RedirectToAction("Index", "Home");
            }

            if (Amount <= simCard.CurrentPrice)
            {
                TempData["Error"] = "Số tiền đấu giá phải lớn hơn giá hiện tại.";
                return RedirectToAction("Details", "Home", new { id = SimCardId });
            }

            if (user.Balance < Amount)
            {
                TempData["Error"] = "Số dư không đủ để đấu giá.";
                return RedirectToAction("Details", "Home", new { id = SimCardId });
            }

            if (DateTime.UtcNow > simCard.EndTime)
            {
                TempData["Error"] = "Phiên đấu giá đã kết thúc.";
                return RedirectToAction("Details", "Home", new { id = SimCardId });
            }

            // Create bid
            var bid = new Bid
            {
                SimCardId = SimCardId,
                UserId = user.Id,
                Amount = Amount,
                CreatedAt = DateTime.UtcNow
            };

            _context.Bids.Add(bid);

            // Update sim card
            simCard.CurrentPrice = Amount;
            simCard.TotalBids++;
            simCard.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            TempData["Success"] = "Đấu giá thành công!";
            return RedirectToAction("Details", "Home", new { id = SimCardId });
        }

        [HttpPost]
        public async Task<IActionResult> BuyNow(string SimCardId)
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null)
            {
                return RedirectToAction("Login", "Account");
            }

            var simCard = await _context.SimCards.FindAsync(SimCardId);
            if (simCard == null || simCard.Status != SimStatus.Active || !simCard.BuyNowPrice.HasValue)
            {
                TempData["Error"] = "Sim không tồn tại hoặc không có giá mua ngay.";
                return RedirectToAction("Index", "Home");
            }

            if (user.Balance < simCard.BuyNowPrice.Value)
            {
                TempData["Error"] = "Số dư không đủ để mua sim.";
                return RedirectToAction("Details", "Home", new { id = SimCardId });
            }

            // Create final bid
            var bid = new Bid
            {
                SimCardId = SimCardId,
                UserId = user.Id,
                Amount = simCard.BuyNowPrice.Value,
                CreatedAt = DateTime.UtcNow
            };

            _context.Bids.Add(bid);

            // Update sim card
            simCard.CurrentPrice = simCard.BuyNowPrice.Value;
            simCard.Status = SimStatus.Sold;
            simCard.WinnerId = user.Id;
            simCard.EndTime = DateTime.UtcNow;
            simCard.TotalBids++;
            simCard.UpdatedAt = DateTime.UtcNow;

            // Update user balance
            user.Balance -= simCard.BuyNowPrice.Value;

            await _context.SaveChangesAsync();

            TempData["Success"] = "Mua sim thành công!";
            return RedirectToAction("Details", "Home", new { id = SimCardId });
        }
    }
}