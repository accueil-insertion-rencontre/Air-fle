import { Injectable } from '@nestjs/common';
import { AttendanceRecord } from '../interfaces/document-generator.interface';

@Injectable()
export class LearnerHistoryAdapter {
  // Adapter désactivé: renvoie des données vides
  constructor() {}

  getAttendanceHistory(uuid: string): Promise<AttendanceRecord[]> {
    // uuid parameter is required but not used in this disabled adapter
    void uuid;
    return Promise.resolve([]);
  }
}
