import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StudentListComponent } from './components/student-list/student-list.component';
import { StudentWizardComponent } from './components/student-wizard/student-wizard.component';
import { StudentProfileComponent } from './components/student-profile/student-profile.component';
import { StudentImportComponent } from './components/student-import/student-import.component';

const routes: Routes = [
  {
    path: '',
    component: StudentListComponent,
  },
  {
    path: 'new',
    component: StudentWizardComponent,
  },
  {
    path: 'import',
    component: StudentImportComponent,
  },
  {
    path: ':id/view',
    component: StudentProfileComponent,
    runGuardsAndResolvers: 'paramsOrQueryParamsChange',
  },
  {
    path: ':id/edit',
    component: StudentWizardComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ApprenantsRoutingModule {}
