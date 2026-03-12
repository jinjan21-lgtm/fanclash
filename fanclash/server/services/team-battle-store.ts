/** In-memory store for active team battles */

interface TeamMember {
  nickname: string;
  amount: number;
  team_index: number;
}

export class TeamBattleManager {
  private id: string;
  private status: 'recruiting' | 'active' | 'finished' | 'cancelled' = 'recruiting';
  private teamCount: number;
  private members: TeamMember[] = [];
  private timeLimit: number;

  constructor(id: string, teamCount: number, timeLimit: number) {
    this.id = id;
    this.teamCount = teamCount;
    this.timeLimit = timeLimit;
  }

  getStatus() { return this.status; }
  getTimeLimit() { return this.timeLimit; }
  getTeamCount() { return this.teamCount; }

  /** Add a member to a team (during recruiting or active) */
  addMember(nickname: string, amount: number, teamIndex: number) {
    const existing = this.members.find(m => m.nickname === nickname);
    if (existing) {
      existing.amount += amount;
    } else {
      this.members.push({ nickname, amount, team_index: teamIndex });
    }
  }

  /** Add donation to existing member */
  addDonation(nickname: string, amount: number) {
    const existing = this.members.find(m => m.nickname === nickname);
    if (existing) {
      existing.amount += amount;
    }
  }

  /** Find which team a member belongs to */
  findMember(nickname: string): TeamMember | undefined {
    return this.members.find(m => m.nickname === nickname);
  }

  start() { this.status = 'active'; }
  cancel() { this.status = 'cancelled'; }

  finish(): number {
    this.status = 'finished';
    const teamTotals: Record<number, number> = {};
    for (let i = 0; i < this.teamCount; i++) teamTotals[i] = 0;
    for (const m of this.members) {
      teamTotals[m.team_index] = (teamTotals[m.team_index] || 0) + m.amount;
    }
    let winningTeam = 0;
    let maxTotal = 0;
    for (const [idx, total] of Object.entries(teamTotals)) {
      if (total > maxTotal) {
        maxTotal = total;
        winningTeam = Number(idx);
      }
    }
    return winningTeam;
  }

  /** Build teams data structure for client */
  getTeamsData(): Record<number, { total: number; members: { nickname: string; amount: number }[] }> {
    const teams: Record<number, { total: number; members: { nickname: string; amount: number }[] }> = {};
    for (let i = 0; i < this.teamCount; i++) {
      teams[i] = { total: 0, members: [] };
    }
    for (const m of this.members) {
      if (!teams[m.team_index]) teams[m.team_index] = { total: 0, members: [] };
      teams[m.team_index].members.push({ nickname: m.nickname, amount: m.amount });
      teams[m.team_index].total += m.amount;
    }
    return teams;
  }
}

export const activeTeamBattles = new Map<string, TeamBattleManager>();
