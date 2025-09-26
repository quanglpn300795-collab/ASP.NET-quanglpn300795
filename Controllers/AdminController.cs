using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SimAuctionMVC.Data;
using SimAuctionMVC.Models;

namespace SimAuctionMVC.Controllers
{
    [Authorize(Roles = "Admin")]
    public class AdminController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public AdminController(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        public async Task<IActionResult> Index()
        {
            var stats = new
            {
                TotalUsers = await _context.Users.CountAsync(),
                TotalSims = await _context.SimCards.CountAsync(),
                ActiveAuctions = await _context.SimCards.CountAsync(s => s.Status == SimStatus.Active),
                TotalBids = await _context.Bids.CountAsync(),
                TotalRevenue = await _context.Bids.SumAsync(b => b.Amount),
                NewUsersToday = await _context.Users.CountAsync(u => u.CreatedAt.Date == DateTime.Today),
                RevenueToday = await _context.Bids.Where(b => b.CreatedAt.Date == DateTime.Today).SumAsync(b => b.Amount)
            };

            ViewBag.Stats = stats;
            return View();
        }

        // Quản lý người dùng
        public async Task<IActionResult> Users()
        {
            var users = await _context.Users.OrderByDescending(u => u.CreatedAt).ToListAsync();
            return View(users);
        }

        [HttpPost]
        public async Task<IActionResult> UpdateUserBalance(string userId, decimal amount)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user != null)
            {
                user.Balance += amount;
                await _context.SaveChangesAsync();
                TempData["Success"] = $"Đã cập nhật số dư cho {user.FullName}";
            }
            return RedirectToAction(nameof(Users));
        }

        // Quản lý sim số
        public async Task<IActionResult> Sims()
        {
            var sims = await _context.SimCards
                .Include(s => s.Winner)
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();
            return View(sims);
        }

        public IActionResult CreateSim()
        {
            return View();
        }

        [HttpPost]
        public async Task<IActionResult> CreateSim(SimCard sim)
        {
            if (ModelState.IsValid)
            {
                sim.Id = Guid.NewGuid().ToString();
                sim.CreatedAt = DateTime.UtcNow;
                sim.UpdatedAt = DateTime.UtcNow;
                sim.CurrentPrice = sim.StartingPrice;

                _context.SimCards.Add(sim);
                await _context.SaveChangesAsync();

                TempData["Success"] = "Tạo sim thành công!";
                return RedirectToAction(nameof(Sims));
            }

            return View(sim);
        }

        public async Task<IActionResult> EditSim(string id)
        {
            var sim = await _context.SimCards.FindAsync(id);
            if (sim == null) return NotFound();
            return View(sim);
        }

        [HttpPost]
        public async Task<IActionResult> EditSim(SimCard sim)
        {
            if (ModelState.IsValid)
            {
                sim.UpdatedAt = DateTime.UtcNow;
                _context.Update(sim);
                await _context.SaveChangesAsync();
                TempData["Success"] = "Cập nhật sim thành công!";
                return RedirectToAction(nameof(Sims));
            }
            return View(sim);
        }

        [HttpPost]
        public async Task<IActionResult> DeleteSim(string id)
        {
            var sim = await _context.SimCards.FindAsync(id);
            if (sim != null)
            {
                _context.SimCards.Remove(sim);
                await _context.SaveChangesAsync();
                TempData["Success"] = "Xóa sim thành công!";
            }
            return RedirectToAction(nameof(Sims));
        }

        // Quản lý đấu giá
        public async Task<IActionResult> Auctions()
        {
            var auctions = await _context.SimCards
                .Include(s => s.Bids)
                .ThenInclude(b => b.User)
                .Include(s => s.Winner)
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();
            return View(auctions);
        }

        public async Task<IActionResult> AuctionDetails(string id)
        {
            var sim = await _context.SimCards
                .Include(s => s.Bids.OrderByDescending(b => b.CreatedAt))
                .ThenInclude(b => b.User)
                .Include(s => s.Winner)
                .FirstOrDefaultAsync(s => s.Id == id);
            
            if (sim == null) return NotFound();
            return View(sim);
        }

        [HttpPost]
        public async Task<IActionResult> EndAuction(string id)
        {
            var sim = await _context.SimCards
                .Include(s => s.Bids)
                .FirstOrDefaultAsync(s => s.Id == id);
            
            if (sim != null && sim.Status == SimStatus.Active)
            {
                sim.Status = SimStatus.Ended;
                var highestBid = sim.Bids.OrderByDescending(b => b.Amount).FirstOrDefault();
                if (highestBid != null)
                {
                    sim.WinnerId = highestBid.UserId;
                    sim.Status = SimStatus.Sold;
                }
                sim.EndTime = DateTime.UtcNow;
                sim.UpdatedAt = DateTime.UtcNow;
                
                await _context.SaveChangesAsync();
                TempData["Success"] = "Đã kết thúc đấu giá!";
            }
            return RedirectToAction(nameof(Auctions));
        }

        // Báo cáo
        public async Task<IActionResult> Reports()
        {
            var today = DateTime.Today;
            var thisMonth = new DateTime(today.Year, today.Month, 1);
            
            var report = new
            {
                // Báo cáo hôm nay
                TodayUsers = await _context.Users.CountAsync(u => u.CreatedAt.Date == today),
                TodayBids = await _context.Bids.CountAsync(b => b.CreatedAt.Date == today),
                TodayRevenue = await _context.Bids.Where(b => b.CreatedAt.Date == today).SumAsync(b => b.Amount),
                
                // Báo cáo tháng này
                MonthUsers = await _context.Users.CountAsync(u => u.CreatedAt >= thisMonth),
                MonthBids = await _context.Bids.CountAsync(b => b.CreatedAt >= thisMonth),
                MonthRevenue = await _context.Bids.Where(b => b.CreatedAt >= thisMonth).SumAsync(b => b.Amount),
                
                // Top sim
                TopSims = (await _context.SimCards
                    .Select(s => new { s.Number, s.CurrentPrice, s.TotalBids })
                    .ToListAsync())
                    .OrderByDescending(s => s.CurrentPrice)
                    .Take(5)
                    .ToList(),
                    
                // Top users
                TopUsers = (await _context.Users
                    .Select(u => new { u.FullName, u.Balance, u.Email })
                    .ToListAsync())
                    .OrderByDescending(u => u.Balance)
                    .Take(5)
                    .ToList()
            };
            
            ViewBag.Report = report;
            return View();
        }
    }
}