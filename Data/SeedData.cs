using Microsoft.AspNetCore.Identity;
using SimAuctionMVC.Models;

namespace SimAuctionMVC.Data
{
    public static class SeedData
    {
        public static async Task Initialize(IServiceProvider serviceProvider, UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager, ApplicationDbContext context)
        {
            // Seed roles
            string[] roleNames = { "Admin", "User" };
            foreach (var roleName in roleNames)
            {
                var roleExist = await roleManager.RoleExistsAsync(roleName);
                if (!roleExist)
                {
                    await roleManager.CreateAsync(new IdentityRole(roleName));
                }
            }

            // Ensure admin user has Admin role
            var adminEmail = "admin@simauction.com";
            var adminUser = await userManager.FindByEmailAsync(adminEmail);
            
            if (adminUser == null)
            {
                // Create admin user
                adminUser = new ApplicationUser 
                { 
                    UserName = adminEmail, 
                    Email = adminEmail, 
                    FullName = "Quản trị viên", 
                    Balance = 50000000, 
                    EmailConfirmed = true 
                };
                var result = await userManager.CreateAsync(adminUser, "123456");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(adminUser, "Admin");
                }
            }
            else
            {
                // Ensure existing admin has Admin role
                if (!await userManager.IsInRoleAsync(adminUser, "Admin"))
                {
                    await userManager.AddToRoleAsync(adminUser, "Admin");
                }
            }

            // Seed other users
            if (await userManager.FindByEmailAsync("user1@test.com") == null)
            {
                var users = new[]
                {
                    new ApplicationUser { UserName = "user1@test.com", Email = "user1@test.com", FullName = "Nguyễn Văn A", Balance = 5000000, EmailConfirmed = true },
                    new ApplicationUser { UserName = "user2@test.com", Email = "user2@test.com", FullName = "Trần Thị B", Balance = 3000000, EmailConfirmed = true }
                };

                foreach (var user in users)
                {
                    var result = await userManager.CreateAsync(user, "123456");
                    if (result.Succeeded)
                    {
                        await userManager.AddToRoleAsync(user, "User");
                    }
                }
            }

            // Seed sim cards
            if (!context.SimCards.Any())
            {
                var sims = new[]
                {
                    new SimCard
                    {
                        Number = "0987654321",
                        Network = "Viettel",
                        StartingPrice = 500000,
                        CurrentPrice = 750000,
                        BuyNowPrice = 2000000,
                        BeautyScore = 4,
                        Category = "Sim lộc phát",
                        Description = "Sim số đẹp với ý nghĩa may mắn, phát tài",
                        Status = SimStatus.Active,
                        StartTime = DateTime.UtcNow.AddDays(-1),
                        EndTime = DateTime.UtcNow.AddDays(2),
                        TotalBids = 5
                    },
                    new SimCard
                    {
                        Number = "0123456789",
                        Network = "Vinaphone",
                        StartingPrice = 1000000,
                        CurrentPrice = 1500000,
                        BuyNowPrice = 5000000,
                        BeautyScore = 5,
                        Category = "Sim thần tài",
                        Description = "Sim số đẹp dãy số tăng dần, rất may mắn",
                        Status = SimStatus.Active,
                        StartTime = DateTime.UtcNow.AddDays(-2),
                        EndTime = DateTime.UtcNow.AddDays(1),
                        TotalBids = 12
                    },
                    new SimCard
                    {
                        Number = "0999888777",
                        Network = "Mobifone",
                        StartingPrice = 800000,
                        CurrentPrice = 1200000,
                        BuyNowPrice = 3000000,
                        BeautyScore = 4,
                        Category = "Sim tam hoa",
                        Description = "Sim tam hoa đẹp, dễ nhớ",
                        Status = SimStatus.Active,
                        StartTime = DateTime.UtcNow.AddHours(-12),
                        EndTime = DateTime.UtcNow.AddHours(36),
                        TotalBids = 8
                    },
                    new SimCard
                    {
                        Number = "0888666444",
                        Network = "Vietnamobile",
                        StartingPrice = 600000,
                        CurrentPrice = 900000,
                        BeautyScore = 3,
                        Category = "Sim năm sinh",
                        Description = "Sim phù hợp với người sinh năm 1988",
                        Status = SimStatus.Active,
                        StartTime = DateTime.UtcNow.AddHours(-6),
                        EndTime = DateTime.UtcNow.AddHours(42),
                        TotalBids = 3
                    },
                    new SimCard
                    {
                        Number = "0777555333",
                        Network = "Viettel",
                        StartingPrice = 700000,
                        CurrentPrice = 1100000,
                        BuyNowPrice = 2500000,
                        BeautyScore = 4,
                        Category = "Sim tứ quý",
                        Description = "Sim tứ quý đẹp, ý nghĩa tốt",
                        Status = SimStatus.Active,
                        StartTime = DateTime.UtcNow.AddHours(-18),
                        EndTime = DateTime.UtcNow.AddHours(30),
                        TotalBids = 7
                    },
                    new SimCard
                    {
                        Number = "0666444222",
                        Network = "Vinaphone",
                        StartingPrice = 400000,
                        CurrentPrice = 650000,
                        BeautyScore = 3,
                        Category = "Sim lộc phát",
                        Description = "Sim số đẹp giá rẻ",
                        Status = SimStatus.Active,
                        StartTime = DateTime.UtcNow.AddHours(-3),
                        EndTime = DateTime.UtcNow.AddHours(45),
                        TotalBids = 2
                    }
                };

                context.SimCards.AddRange(sims);
                await context.SaveChangesAsync();
            }
        }
    }
}