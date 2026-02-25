import os
import sys
import json
import asyncio
import time
import random
from typing import Optional, List
from datetime import datetime

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

try:
    import typer
    import questionary
    from rich.console import Console, Group
    from rich.layout import Layout
    from rich.panel import Panel
    from rich.table import Table
    from rich.text import Text
    from rich.live import Live
    from rich.progress import Progress, SpinnerColumn, TextColumn
    from rich.rule import Rule
    from rich.columns import Columns
    from rich import print as rprint
except ImportError:
    print("Error: Missing dependencies. Run: pip install typer rich questionary")
    sys.exit(1)

from dotenv import load_dotenv
load_dotenv(os.path.join("backend", ".env"))

# --- Backend Feature Bridges ---
def get_logic():
    from backend.matcher import run_matching
    from backend.github_api import fetch_repo_data
    from backend.monetization import fetch_live_bounties, generate_monetization_strategy
    from backend.fundability import analyze_fundability
    from backend.time_machine import generate_roadmap
    from backend.portfolio import optimize_portfolio
    from backend.funding_db import FUNDING_SOURCES
    return {
        "fetch_repo_data": fetch_repo_data,
        "run_matching": run_matching,
        "fetch_live_bounties": fetch_live_bounties,
        "generate_monetization_strategy": generate_monetization_strategy,
        "analyze_fundability": analyze_fundability,
        "generate_roadmap": generate_roadmap,
        "optimize_portfolio": optimize_portfolio,
        "funding_sources": FUNDING_SOURCES
    }

app = typer.Typer(help="OpenGrant 2.0 - Developed by Chiranjib")
console = Console()

# --- Aesthetic Assets ---
ASCII_LOGO = """
[bold cyan]  ██████╗ ██████╗ ███████╗███╗   ██╗ ██████╗ ██████╗  █████╗ ███╗   ██╗████████╗[/bold cyan]
[bold cyan] ██╔═══██╗██╔══██╗██╔════╝████╗  ██║██╔════╝ ██╔══██╗██╔══██╗████╗  ██║╚══██╔══╝[/bold cyan]
[bold blue] ██║   ██║██████╔╝█████╗  ██╔██╗ ██║██║  ███╗██████╔╝███████║██╔██╗ ██║   ██║   [/bold blue]
[bold blue] ██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║██║   ██║██╔══██╗██╔══██║██║╚██╗██║   ██║   [/bold blue]
[bold magenta] ╚██████╔╝██║     ███████╗██║ ╚████║╚██████╔╝██║  ██║██║  ██║██║ ╚████║   ██║   [/bold magenta]
[bold magenta]  ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝   [/bold magenta]
"""

def glitch_splash():
    """Hacker-style animated splash screen."""
    os.system('cls' if os.name == 'nt' else 'clear')
    frames = ["[bold cyan]INITIALIZING...[/bold cyan]", "[bold blue]CONNECTING...[/bold blue]", "[bold magenta]OPTIMIZING...[/bold magenta]"]
    for _ in range(3):
        for frame in frames:
            console.print(ASCII_LOGO, justify="center")
            console.print(f"\n[bold green]>>> {frame}[/bold green]", justify="center")
            time.sleep(0.1)
            os.system('cls' if os.name == 'nt' else 'clear')
    
    # Final splash
    console.print(ASCII_LOGO, justify="center")
    console.print("[bold white on blue] THE ULTIMATE OSS FUNDING OS [/bold white on blue]", justify="center")
    console.print("[italic dim]Founder & Lead Architect: Chiranjib[/italic dim]", justify="center")
    console.print("\n" + "="*80 + "\n", style="dim")

def print_header():
    console.print(ASCII_LOGO, justify="center")
    console.print("[bold cyan]Author: Chiranjib | Version: 2.0 (Hacker Edition)[/bold cyan]", justify="center")
    console.print("-" * console.width, style="blue dim")

def hacker_typing(text: str, delay: float = 0.01):
    """Prints text with a typing effect."""
    for char in text:
        sys.stdout.write(char)
        sys.stdout.flush()
        time.sleep(delay)
    print()

# --- Feature Runners ---

def run_scan(url: str):
    logic = get_logic()
    try:
        with Progress(
            SpinnerColumn("dots12"),
            TextColumn("[bold cyan]{task.description}"),
            transient=True,
        ) as progress:
            progress.add_task(description="[HACKER] Intercepting Repository Data...", total=None)
            repo_data = asyncio.run(logic["fetch_repo_data"](url))
            
            progress.add_task(description="[HACKER] Calculating Synergy Matrices...", total=None)
            matches = asyncio.run(logic["run_matching"](repo_data, logic["funding_sources"]))
            
            progress.add_task(description="[HACKER] Compiling Fundability Score...", total=None)
            score_data = logic["analyze_fundability"](repo_data)

        # Dashboard Output
        layout = Layout()
        layout.split_column(
            Layout(name="header", size=3),
            Layout(name="body", ratio=1)
        )
        layout["body"].split_row(
            Layout(name="metrics", ratio=1),
            Layout(name="matches", ratio=2)
        )

        metrics_table = Table(title="[bold yellow]CORE METRICS[/bold yellow]", border_style="yellow")
        metrics_table.add_column("Key", style="cyan")
        metrics_table.add_column("Value", style="bold")
        metrics_table.add_row("Health Grade", f"[bold green]{score_data['grade']}[/bold green]")
        metrics_table.add_row("Power Score", f"{score_data['total_score']}/100")
        metrics_table.add_row("Stars", str(repo_data.get('stars', 0)))
        metrics_table.add_row("Commits/Wk", f"{repo_data.get('commit_frequency', 0):.1f}")

        matches_table = Table(title="[bold green]TOP FUNDING OPPORTUNITIES[/bold green]", border_style="green")
        matches_table.add_column("ID", style="dim")
        matches_table.add_column("Funder", style="bold")
        matches_table.add_column("Level", justify="right")
        matches_table.add_column("Amount", style="yellow")

        for i, m in enumerate(matches[:8]):
            fs = m.get('funding', {})
            matches_table.add_row(
                str(i+1),
                fs.get('name', 'N/A'),
                f"{m.get('score', 0)}%",
                f"${fs.get('max_amount', 0):,}"
            )

        console.print(Panel(metrics_table, title="Diagnostic", border_style="cyan"), justify="center")
        console.print(Panel(matches_table, title="Matches", border_style="green"))
        
    except Exception as e:
        console.print(Panel(f"[bold red]EXECUTION ABORTED:[/bold red] {e}", border_style="red"))

def run_roadmap(url: str):
    logic = get_logic()
    try:
        with console.status("[bold magenta]Predicting Funding Time-Travel Roadmap...") as status:
            repo_data = asyncio.run(logic["fetch_repo_data"](url))
            matches = asyncio.run(logic["run_matching"](repo_data, logic["funding_sources"]))
            roadmap = asyncio.run(logic["generate_roadmap"](repo_data, [m['funding'] for m in matches[:3]]))

        console.print(Panel(f"[bold cyan]ROADMAP: {repo_data['repo_name']}[/bold cyan]", subtitle="Created by Chiranjib"))
        
        for ms in roadmap.get('milestones', []):
            table = Table(title=f"[bold yellow]{ms['week']}: {ms['theme']}[/bold yellow]", show_header=True, header_style="bold magenta")
            table.add_column("Proposed Action", style="white")
            table.add_column("Impact", style="dim italic")
            for action in ms.get('actions', []):
                table.add_row(action['action'], action['impact'])
            console.print(table)
            console.print("\n")
            
        console.print(f"[bold red]CRITICAL FIXES:[/bold red] {', '.join(roadmap.get('red_flags', [])) or 'None'}")
    except Exception as e:
        console.print(f"[bold red]Error:[/bold red] {e}")

def run_portfolio(url: str):
    logic = get_logic()
    try:
        with console.status("[bold yellow]Optimizing Grant Stack Portfolio...") as status:
            repo_data = asyncio.run(logic["fetch_repo_data"](url))
            matches = asyncio.run(logic["run_matching"](repo_data, logic["funding_sources"]))
            # Convert matches to logic format
            clean_matches = []
            for m in matches:
                clean_matches.append({
                    "funding_score": m['score'],
                    "match_score": m['score'],
                    "funding_source": m['funding']
                })
            portfolio = logic["optimize_portfolio"](clean_matches)

        console.print(Panel(f"[bold blue]OPTIMAL GRANT STACK - TOTAL POTENTIAL: ${portfolio['total_potential_usd']:,}[/bold blue]"))
        
        table = Table(show_header=True, header_style="bold cyan")
        table.add_column("Order", style="dim")
        table.add_column("Grant Name", style="bold")
        table.add_column("Match Score", justify="right")
        table.add_column("Effort", style="yellow")

        for i, g in enumerate(portfolio['optimal_stack']):
            table.add_row(str(i+1), g['name'], f"{g['score']}%", f"{g['effort_weeks']} wks")
        
        console.print(table)
        console.print("\n[bold yellow]Strategy Notes:[/bold yellow]")
        for note in portfolio.get('strategy_notes', []):
            console.print(f" > {note}")
    except Exception as e:
        console.print(f"[bold red]Error:[/bold red] {e}")

# --- Main Entry ---

@app.callback(invoke_without_command=True)
def main(ctx: typer.Context):
    if ctx.invoked_subcommand is not None:
        return

    glitch_splash()
    
    while True:
        choice = questionary.select(
            "CHIRANJIB COMMAND CENTER // SELECT ACTION:",
            choices=[
                "📡 FULL SYSTEM SCAN (Grants + Metrics)",
                "📅 GENERATE 90-DAY ROADMAP (Calendar)",
                "💼 OPTIMIZE GRANT PORTFOLIO",
                "🎯 SEARCH LIVE BOUNTIES",
                "📝 DRAFT PRO APPLICATION",
                "💰 GENERATE MONETIZATION STRATEGY",
                "🌐 DEPLOY WEB INTERFACE",
                "❌ SHUTDOWN"
            ],
            style=questionary.Style([
                ('pointer', 'fg:#00ff00 bold'),
                ('highlighted', 'fg:#00ffff bold'),
                ('selected', 'fg:#ff00ff'),
                ('question', 'fg:#ffffff bold'),
                ('answer', 'fg:#ffffff bold')
            ])
        ).ask()

        if choice == "📡 FULL SYSTEM SCAN (Grants + Metrics)":
            url = questionary.text("REPOSITORY URL:").ask()
            if url: run_scan(url)
        elif choice == "📅 GENERATE 90-DAY ROADMAP (Calendar)":
            url = questionary.text("REPOSITORY URL:").ask()
            if url: run_roadmap(url)
        elif choice == "💼 OPTIMIZE GRANT PORTFOLIO":
            url = questionary.text("REPOSITORY URL:").ask()
            if url: run_portfolio(url)
        elif choice == "🎯 SEARCH LIVE BOUNTIES":
            query = questionary.text("QUERY:", default="label:bounty").ask()
            if query:
                from backend.monetization import fetch_live_bounties
                bounties = asyncio.run(fetch_live_bounties(query))
                table = Table(title="LIVE BOUNTIES", border_style="magenta")
                table.add_column("Title", style="white")
                table.add_column("Amount", style="green")
                for b in bounties[:10]:
                    table.add_row(b['title'][:40], f"${b['amount']}")
                console.print(table)
        elif choice == "📝 DRAFT PRO APPLICATION":
            url = questionary.text("REPOSITORY URL:").ask()
            if url:
                f_id = questionary.text("FUNDING ID:").ask()
                if f_id:
                    # Logic from old write command
                    from backend.application_writer import generate_application
                    from backend.funding_db import FUNDING_SOURCES
                    from backend.github_api import fetch_repo_data
                    repo_data = asyncio.run(fetch_repo_data(url))
                    fs = FUNDING_SOURCES[int(f_id)-1]
                    app_json = asyncio.run(generate_application(repo_data, fs))
                    console.print(Panel(json.dumps(app_json, indent=2), title="Draft Generated", border_style="green"))
        elif choice == "💰 GENERATE MONETIZATION STRATEGY":
            url = questionary.text("REPOSITORY URL:").ask()
            if url:
                # Logic from old monetize command
                from backend.monetization import generate_monetization_strategy
                from backend.github_api import fetch_repo_data
                repo_data = asyncio.run(fetch_repo_data(url))
                strategy = asyncio.run(generate_monetization_strategy(repo_data))
                console.print(Panel(str(strategy.get('fundingYml', 'N/A')), title="Monetization Strategy", border_style="blue"))
        elif choice == "🌐 DEPLOY WEB INTERFACE":
            console.print("[bold green]DEPLOYING SERVERS...[/bold green]")
            import subprocess
            if os.name == 'nt': subprocess.Popen(["cmd", "/c", "START.bat"])
            else: subprocess.Popen(["sh", "./START.bat"])
            break
        elif choice == "❌ SHUTDOWN":
            console.print("[bold cyan]COMMAND CENTER OFFLINE. GOODBYE CHIRANJIB.[/bold cyan]")
            break
        
        input("\n[bold green]>>> SYSTEM READY. PRESS ENTER TO RETURN TO MENU...[/bold green]")
        os.system('cls' if os.name == 'nt' else 'clear')

if __name__ == "__main__":
    app()
