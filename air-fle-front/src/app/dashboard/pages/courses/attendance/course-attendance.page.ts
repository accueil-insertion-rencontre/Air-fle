import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AttendanceService, AttendanceGetResponse, AttendancePostBody, AttendanceStudentInput, NewAttendanceStatus } from '@core/services/attendance.service';

@Component({
  standalone: true,
  selector: 'app-course-attendance',
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
  <div class="attendance-page state" *ngIf="state==='loading'">Chargement…</div>
  <div class="attendance-page state error" *ngIf="state==='error'">{{error}}</div>

  <div class="attendance-page" *ngIf="state==='ready' && data as d" [class.readonly]="d.attendance_taken">
    <div class="header">
      <h2>Prise d'appel</h2>
      <div class="chips" *ngIf="d.summary">
        <span class="chip success">Présents: {{d.summary.present || 0}}</span>
        <span class="chip danger">Absents: {{d.summary.absent || 0}}</span>
        <span class="chip info">Justifiés: {{d.summary.justified || 0}}</span>
        
      </div>
    </div>

    <div *ngIf="d.attendance_taken" class="banner success">
      Appel validé par {{d.attendance_taken_by?.user_firstname}} {{d.attendance_taken_by?.user_lastname}} le {{ d.attendance_taken_at | date:'dd/MM/yyyy HH:mm' }}
    </div>

    <ng-container *ngIf="!d.attendance_taken; else readOnly">
      <div class="toolbar">
        <button class="btn primary" (click)="markAll('present')">Tout marquer présent</button>
        <div class="hint">Astuce: cliquer un statut pour l’appliquer</div>
      </div>

      <div class="list">
        <div class="row" *ngFor="let s of form; index as i">
          <div class="cell name">
            <div class="avatar">{{ (s.firstname || ' ')[0] }}</div>
            <div class="fullname">{{s.firstname}} {{s.lastname}}</div>
          </div>
          <div class="cell status">
            <div class="segmented hide-sm">
              <button type="button" class="seg present" [class.active]="s.status==='present'" (click)="s.status='present'">Présent</button>
              <button type="button" class="seg absent" [class.active]="s.status==='absent'" (click)="s.status='absent'">Absent</button>
              <button type="button" class="seg justified" [class.active]="s.status==='justified'" (click)="s.status='justified'">Justifié</button>
              
            </div>
            <div class="show-sm select-wrap">
              <select [(ngModel)]="s.status" name="status-{{s.student_uuid}}" aria-label="Statut">
                <option value="present">Présent</option>
                <option value="absent">Absent</option>
                <option value="justified">Justifié</option>
                
              </select>
            </div>
          </div>
          <!-- Champ note supprimé pour simplifier la saisie → cohérent avec le projet -->
        </div>
      </div>

      <div class="sticky-actions">
        <button class="btn success" [disabled]="submitting" (click)="submit()">Valider l'appel</button>
      </div>
    </ng-container>

    <ng-template #readOnly>
      <div class="readonly-list">
        <div class="readonly-item" *ngFor="let s of d.students">
          <div class="left">
            <div class="avatar">{{ (s.firstname || ' ')[0] }}</div>
            <div class="fullname">{{s.firstname}} {{s.lastname}}</div>
          </div>
          <div class="right">
            <span class="badge" [ngClass]="{
              'success': s.status==='present',
              'danger': s.status==='absent',
              'info': s.status==='justified',
               
            }">{{s.status}}</span>
            <span class="note" *ngIf="s.notes">— {{s.notes}}</span>
          </div>
        </div>
      </div>
    </ng-template>
  </div>
  `,
  styles: [`
    :host{display:block}
    .attendance-page{padding:16px}
    .state{color:#374151}
    .state.error{color:#b91c1c}

    .header{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px}
    .header h2{font-size:20px;margin:0}
    .chips{display:flex;gap:8px;flex-wrap:wrap}
    .chip{padding:4px 8px;border-radius:999px;font-size:12px;border:1px solid #e5e7eb;background:#f9fafb}
    .chip.success{background:#ecfdf5;border-color:#a7f3d0;color:#065f46}
    .chip.danger{background:#fef2f2;border-color:#fecaca;color:#7f1d1d}
    .chip.info{background:#eff6ff;border-color:#bfdbfe;color:#1e40af}
    .chip.warning{background:#fffbeb;border-color:#fde68a;color:#92400e}

    .banner{border-radius:8px;padding:10px 12px;margin:12px 0;border:1px solid #e5e7eb}
    .banner.success{background:#ecfdf5;border-color:#a7f3d0;color:#065f46}

    .toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:12px 0}
    .hint{font-size:12px;color:#6b7280}

    .btn{appearance:none;border:1px solid #e5e7eb;background:#fff;color:#111827;border-radius:8px;padding:8px 12px;cursor:pointer}
    .btn.primary{background:#111827;color:#fff;border-color:#111827}
    .btn.success{background:#059669;border-color:#059669;color:#fff}
    .btn:disabled{opacity:.6;cursor:not-allowed}

    .list{display:flex;flex-direction:column;gap:10px}
    .row{display:grid;grid-template-columns: minmax(180px, 1fr) auto;gap:12px;align-items:center;border:1px solid #e5e7eb;border-radius:12px;padding:10px;background:#fff}
    .cell.name{display:flex;align-items:center;gap:10px;min-width:0}
    .avatar{width:32px;height:32px;border-radius:50%;background:#111827;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:600}
    .fullname{font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

    .segmented{display:inline-flex;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;background:#f9fafb}
    .seg{padding:6px 10px;border:none;background:transparent;cursor:pointer;color:#374151}
    .seg+ .seg{border-left:1px solid #e5e7eb}
    .seg.present.active{background:#ecfdf5;color:#065f46}
    .seg.absent.active{background:#fef2f2;color:#7f1d1d}
    .seg.justified.active{background:#eff6ff;color:#1e40af}
    .seg.late.active{background:#fffbeb;color:#92400e}

    .select-wrap select{width:100%;padding:8px;border:1px solid #e5e7eb;border-radius:8px;background:#fff}
    .hide-sm{display:block}
    .show-sm{display:none}

    /* notes supprimé */

    .sticky-actions{position:sticky;bottom:0;background:linear-gradient(180deg, rgba(255,255,255,0), #ffffff 30%);padding:12px 0;margin-top:8px;display:flex;justify-content:flex-end}

    /* Read-only list */
    .readonly-list{display:flex;flex-direction:column;gap:8px;margin-top:8px}
    .readonly-item{display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid #e5e7eb;border-radius:10px;padding:10px;background:#fff}
    .readonly-item .left{display:flex;align-items:center;gap:10px}
    .badge{padding:4px 8px;border-radius:999px;border:1px solid #e5e7eb;font-size:12px;text-transform:capitalize}
    .badge.success{background:#ecfdf5;border-color:#a7f3d0;color:#065f46}
    .badge.danger{background:#fef2f2;border-color:#fecaca;color:#7f1d1d}
    .badge.info{background:#eff6ff;border-color:#bfdbfe;color:#1e40af}
    .badge.warning{background:#fffbeb;border-color:#fde68a;color:#92400e}
    .note{color:#6b7280}

    /* Responsive */
    @media (max-width: 900px){
      .row{grid-template-columns: minmax(160px, 1fr) auto}
    }
    @media (max-width: 680px){
      .hide-sm{display:none}
      .show-sm{display:block}
      .row{grid-template-columns: 1fr;gap:8px}
      .cell.status{order:3}
      .sticky-actions{justify-content:stretch}
      .sticky-actions .btn{width:100%}
    }
  `]
})
export class CourseAttendancePage implements OnInit {
  state: 'loading'|'ready'|'error' = 'loading';
  error = '';
  data: AttendanceGetResponse | null = null;
  form: (AttendanceStudentInput & { firstname: string; lastname: string })[] = [];
  submitting = false;
  statusOptions: NewAttendanceStatus[] = ['present','absent','justified'];

  constructor(private route: ActivatedRoute, private attendance: AttendanceService) {}

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    this.attendance.getCourseAttendanceNew(id).subscribe({
      next: (res) => {
        this.data = res;
        this.form = (res.students||[]).map(s => ({ student_uuid: s.student_uuid, status: (s.status||'present') as NewAttendanceStatus, notes: s.notes||'', firstname: s.firstname, lastname: s.lastname }));
        this.state = 'ready';
      },
      error: (err) => {
        this.error = err?.message || 'Erreur de chargement';
        this.state = 'error';
      }
    });
  }

  markAll(status: NewAttendanceStatus){ this.form = this.form.map(s => ({...s, status})); }

  submit(){
    if(!this.data) return;
    this.submitting = true;
    const body: AttendancePostBody = { students: this.form.map(({student_uuid,status}) => ({student_uuid,status})) };
    this.attendance.submitCourseAttendance(this.data.course_uuid, body).subscribe({
      next: () => {
        // recharger
        this.attendance.getCourseAttendanceNew(this.data!.course_uuid).subscribe(r=>{ this.data = r; this.submitting=false; });
      },
      error: (err) => { this.submitting=false; this.error = err?.error?.message || 'Erreur lors de la validation de l\'appel'; }
    })
  }
}


