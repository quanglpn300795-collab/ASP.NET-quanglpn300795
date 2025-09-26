using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SimAuctionMVC.Data;
using SimAuctionMVC.Models;

namespace SimAuctionMVC.Controllers;

public class HomeController : Controller
{
    private readonly ILogger<HomeController> _logger;
    private readonly ApplicationDbContext _context;

    public HomeController(ILogger<HomeController> logger, ApplicationDbContext context)
    {
        _logger = logger;
        _context = context;
    }

    public async Task<IActionResult> Index(string network = "", string category = "", string sortBy = "EndTime")
    {
        var query = _context.SimCards
            .Where(s => s.Status == SimStatus.Active)
            .AsQueryable();

        if (!string.IsNullOrEmpty(network))
        {
            query = query.Where(s => s.Network == network);
        }

        if (!string.IsNullOrEmpty(category))
        {
            query = query.Where(s => s.Category == category);
        }

        query = sortBy switch
        {
            "PriceAsc" => query.OrderBy(s => s.CurrentPrice),
            "PriceDesc" => query.OrderByDescending(s => s.CurrentPrice),
            "BeautyScore" => query.OrderByDescending(s => s.BeautyScore),
            _ => query.OrderBy(s => s.EndTime)
        };

        var sims = await query.Take(12).ToListAsync();

        ViewBag.Network = network;
        ViewBag.Category = category;
        ViewBag.SortBy = sortBy;
        ViewBag.TotalAuctions = await _context.SimCards.CountAsync();
        ViewBag.ActiveAuctions = await _context.SimCards.CountAsync(s => s.Status == SimStatus.Active);
        ViewBag.TotalUsers = await _context.Users.CountAsync();

        return View(sims);
    }

    public async Task<IActionResult> Details(string id)
    {
        if (id == null)
        {
            return NotFound();
        }

        var simCard = await _context.SimCards
            .Include(s => s.Bids)
            .ThenInclude(b => b.User)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (simCard == null)
        {
            return NotFound();
        }

        return View(simCard);
    }

    public IActionResult Privacy()
    {
        return View();
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }
}
