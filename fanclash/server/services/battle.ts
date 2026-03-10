interface Participant { nickname: string; amount: number; }

export class BattleManager {
  private id: string;
  private status: 'recruiting' | 'active' | 'finished' | 'cancelled' = 'recruiting';
  private participants: Participant[] = [];
  private timeLimit: number;

  constructor(id: string, timeLimit: number) {
    this.id = id;
    this.timeLimit = timeLimit;
  }

  getStatus() { return this.status; }
  getParticipants() { return [...this.participants]; }
  getTimeLimit() { return this.timeLimit; }

  addParticipant(nickname: string, amount: number) {
    if (this.status !== 'recruiting') throw new Error('모집 중이 아닙니다');
    this.participants.push({ nickname, amount });
  }

  start() {
    if (this.participants.length < 2) throw new Error('최소 2명의 참가자가 필요합니다');
    this.status = 'active';
  }

  addDonation(nickname: string, amount: number) {
    if (this.status !== 'active') throw new Error('배틀이 진행 중이 아닙니다');
    const p = this.participants.find(p => p.nickname === nickname);
    if (!p) throw new Error('참가자가 아닙니다');
    p.amount += amount;
  }

  finish(): string {
    if (this.status !== 'active') throw new Error('배틀이 진행 중이 아닙니다');
    this.status = 'finished';
    const sorted = [...this.participants].sort((a, b) => b.amount - a.amount);
    return sorted[0].nickname;
  }

  cancel() { this.status = 'cancelled'; }
}
