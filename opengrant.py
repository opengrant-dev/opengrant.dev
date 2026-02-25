import os
import sys
import json
import asyncio
from typing import Optional
from datetime import datetime

# Add backend to path so we can import modules
sys.path.append(os.path.join(os.getcwd(), "backend"))

try:
    import typer
    from rich.console import Console
    from rich.table import Table
    from rich.panel import Panel
    from rich.progress import Progress, SpinnerColumn, TextColumn
    from rich import print as rprint
except ImportError:
    print("Error: 'typer' and 'rich' are required for the CLI. Run: pip install typer rich")
    sys.exit(1)

from dotenv import load_dotenv
load_dotenv(os.path.join("backend", ".env"))

# Lazy imports for backend logic
def get_logic():
    from backend.matcher import run_matching
    from backend.github_api import fetch_repo_data
    from backend.monetization import fetch_live_bounties, generate_monetization_strategy
    from backend.fundability import analyze_fundability
    return fetch_repo_data, run_matching, fetch_live_bounties, generate_monetization_strategy, analyze_fundability

app = typer.Typer(help="OpenGrant CLI - Find funding and monetize your OSS projects.")
console = Console()

ASCII_ART = """
[bold cyan]  ██████╗ ██████╗ ███████╗███╗   ██╗ ██████╗ ██████╗  █████╗ ███╗   ██╗████████╗[/bold cyan]
[bold cyan] ██╔═══██╗██╔══██╗██╔════╝████╗  ██║██╔════╝ ██╔══██╗██╔══██╗████╗  ██║╚══██╔══╝[/bold cyan]
[bold blue] ██║   ██║██████╔╝█████╗  ██╔██╗ ██║██║  ███╗██████╔╝███████║██╔██╗ ██║   ██║   [/bold blue]
[bold blue] ██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║██║   ██║██╔══██╗██╔══██║██║╚██╗██║   ██║   [/bold blue]
[bold magenta] ╚██████╔╝██║     ███████╗██║ ╚████║╚██████╔╝██║  ██║██║  ██║██║ ╚████║   ██║   [/bold magenta]
[bold magenta]  ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝ ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝   ╚═╝   [/bold magenta]
"""

def print_header():
    console.print(ASCII_ART)
    console.print("[bold white]The AI-Powered Open Source Funding Discovery Platform[/bold white]\n")
    
    social_table = Table.grid(padding=(0, 2))
    social_table.add_column(style="cyan")
    social_table.add_column(style="magenta")
    social_table.add_row(
        "Twitter: [bold]@chiranjibai[/bold]",
        "GitHub: [bold]ChiranjibAI[/bold]"
    )
    console.print(Panel(social_table, border_style="dim", title="[bold dim]Connect & Support[/bold dim]", expand=False))
    console.print("\n")

@app.callback(invoke_without_command=True)
def main(ctx: typer.Context):
    """
    Main entry point for OpenGrant CLI. Prints branding if no command is given.
    """
    if ctx.invoked_subcommand is None:
        print_header()
        console.print("[bold yellow]Available Commands:[/bold yellow]")
        console.print("  [bold green]scan[/bold green] [dim]<url>[/dim]      - Scan repo for funding matches")
        console.print("  [bold green]monetize[/bold green] [dim]<url>[/dim]  - Generate AI monetization strategy")
        console.print("  [bold green]bounties[/bold green]         - Search live paid bounties")
        console.print("  [bold green]write[/bold green] [dim]<url> <id>[/dim] - Draft a full grant application")
        console.print("  [bold green]serve[/bold green]            - Start full-stack UI & API")
        console.print("\n[dim]Run [bold]python opengrant.py <command> --help[/bold] for details.[/dim]")

@app.command()
def scan(url: str):
    """Scan a repository and find funding matches."""
    print_header()
    fetch_repo_data, run_matching, _, _, analyze_fundability = get_logic()
    
    with Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        transient=True,
    ) as progress:
        progress.add_task(description="Fetching repository data...", total=None)
        repo_data = asyncio.run(fetch_repo_data(url))
        
        if "error" in repo_data:
            console.print(f"[bold red]Error:[/bold red] {repo_data['error']}")
            raise typer.Exit(1)

        progress.add_task(description="Analyzing funding matches...", total=None)
        # We need funding sources to run matching. 
        # In CLI, we'll fetch them from the funding_db module.
        from backend.funding_db import FUNDING_SOURCES
        
        # Inject IDs if missing (required by matcher)
        for i, fs in enumerate(FUNDING_SOURCES):
            if "id" not in fs:
                fs["id"] = i + 1
                
        matches = asyncio.run(run_matching(repo_data, FUNDING_SOURCES))
        
        progress.add_task(description="Calculating fundability score...", total=None)
        score_data = analyze_fundability(repo_data)

    # UI Output
    console.print(Panel(f"[bold green]Analysis Complete for {repo_data['repo_name']}[/bold green]"))
    
    # Score Table
    score_table = Table(title="Fundability Dashboard")
    score_table.add_column("Metric", style="cyan")
    score_table.add_column("Value", style="magenta")
    score_table.add_row("Overall Grade", f"[bold]{score_data['grade']}[/bold] ({score_data['total_score']}/100)")
    score_table.add_row("Stars", str(repo_data.get('stars', 0)))
    score_table.add_row("Issues Found", str(len(matches)))
    console.print(score_table)

    # Matches Table
    match_table = Table(title="Top Funding Matches")
    match_table.add_column("Source", style="green")
    match_table.add_column("Match %", justify="right")
    match_table.add_column("Amount", style="yellow")
    match_table.add_column("Deadline", style="dim")

    for match in matches[:10]:
        fs = match.get('funding', {})
        match_table.add_row(
            fs.get('name', 'Unknown'),
            f"{match.get('score', 0)}%",
            fs.get('amount_display') or (f"${fs['max_amount']:,}" if fs.get('max_amount') else "Variable"),
            fs.get('deadline', 'Rolling')
        )
    console.print(match_table)
    
    rprint(f"\n[dim]Run [bold]python opengrant.py serve[/bold] to see the full list and generate applications.[/dim]")

@app.command()
def bounties(query: str = "label:bounty label:\"help wanted\" state:open"):
    """Fetch live paid bounties from GitHub."""
    print_header()
    _, _, fetch_live_bounties, _, _ = get_logic()
    
    with console.status("[bold green]Searching for bounties...") as status:
        bounties_list = asyncio.run(fetch_live_bounties(query))

    table = Table(title=f"Live Bounties for: {query}")
    table.add_column("Title", style="cyan", no_wrap=False)
    table.add_column("Repo", style="magenta")
    table.add_column("Amount", style="green")
    table.add_column("Platform", style="dim")

    for b in bounties_list[:15]:
        table.add_row(
            b['title'][:50] + "..." if len(b['title']) > 50 else b['title'],
            b['repo'],
            f"${b['amount']}",
            b['platform']
        )
    console.print(table)

@app.command()
def monetize(url: str):
    """Generate an AI monetization strategy for a repository."""
    print_header()
    fetch_repo_data, _, _, generate_monetization_strategy, _ = get_logic()
    
    with console.status("[bold yellow]Generating AI Strategy...") as status:
        repo_data = asyncio.run(fetch_repo_data(url))
        if "error" in repo_data:
            console.print(f"[bold red]Error:[/bold red] {repo_data['error']}")
            return
        
        strategy = asyncio.run(generate_monetization_strategy(repo_data))

    console.print(Panel.fit("[bold green]AI Monetization Strategy[/bold green]"))
    
    # Ensure strategy is a dict and has keys
    if not strategy or not isinstance(strategy, dict):
        console.print("[yellow]Warning: AI strategy was empty or invalid. Using defaults.[/yellow]")
        strategy = {}

    console.print("\n[bold]FUNDING.yml Suggestion:[/bold]")
    console.print(Panel(str(strategy.get('fundingYml') or 'N/A'), border_style="blue"))
    
    console.print("\n[bold]README Support Snippet:[/bold]")
    console.print(Panel(str(strategy.get('readmeSnippet') or 'N/A'), border_style="magenta"))
    
    console.print("\n[bold]Expert Tips:[/bold]")
    tips = strategy.get('tips') or ["Enable GitHub Sponsors", "Add a FUNDING.yml file", "Look for grants"]
    for tip in tips:
        if tip:
            console.print(f" • {tip}")

@app.command()
def write(url: str, funding_id: int):
    """Generate a complete grant application for a repository and funding source."""
    print_header()
    fetch_repo_data, _, _, _, _ = get_logic()
    from backend.application_writer import generate_application
    from backend.funding_db import FUNDING_SOURCES
    
    with console.status("[bold blue]Drafting Grant Application...") as status:
        repo_data = asyncio.run(fetch_repo_data(url))
        if "error" in repo_data:
            console.print(f"[bold red]Error:[/bold red] {repo_data['error']}")
            return
            
        # Find funding source by ID (1-indexed for CLI)
        if funding_id < 1 or funding_id > len(FUNDING_SOURCES):
            console.print(f"[bold red]Error:[/bold red] Funding ID {funding_id} not found. Run 'scan' to see valid IDs.")
            return
            
        funding_source = FUNDING_SOURCES[funding_id - 1]
        
        # Inject ID for consistency
        funding_source["id"] = funding_id
        
        application = asyncio.run(generate_application(repo_data, funding_source))

    if "error" in application:
        console.print(f"[bold red]Error:[/bold red] {application['error']}")
        return

    console.print(Panel(f"[bold green]Application Draft Ready for {funding_source['name']}[/bold green]"))
    
    # Save to file
    filename = f"application_{repo_data['repo_name'].replace('/', '_')}_{funding_id}.json"
    with open(filename, "w") as f:
        json.dump(application, f, indent=2)
        
    console.print(f"\n[cyan]Executive Summary:[/cyan]\n{application.get('executive_summary', 'N/A')}")
    console.print(f"\n[bold green]Full JSON saved to: {filename}[/bold green]")

@app.command()
def serve():
    """Start both backend and frontend servers."""
    console.print("[bold green]Starting OpenGrant Full Stack...[/bold green]")
    import subprocess
    
    # Determine the correct command for the OS
    if os.name == 'nt': # Windows
        subprocess.Popen(["cmd", "/c", "START.bat"])
    else: # Mac/Linux
        # Basic shell start for Unix
        subprocess.Popen(["sh", "./START.bat"]) # Assuming START.bat is shell-compatible or has a .sh equivalent
        # Note: In a real scenario we'd create a START.sh
    
    console.print("[bold]Servers launched in separate windows.[/bold]")
    console.print("API: [blue]http://localhost:8765/docs[/blue]")
    console.print("UI:  [blue]http://localhost:5173[/blue]")

if __name__ == "__main__":
    app()
