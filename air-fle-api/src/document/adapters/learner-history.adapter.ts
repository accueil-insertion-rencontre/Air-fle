import { Injectable } from '@nestjs/common';
import { AttendanceRecord } from '../interfaces/document-generator.interface';

@Injectable()
export class LearnerHistoryAdapter {
  // Adapter désactivé: renvoie des données vides
  constructor() {}

  async getAttendanceHistory(uuid: string): Promise<AttendanceRecord[]> {
    return [];
  }
}
