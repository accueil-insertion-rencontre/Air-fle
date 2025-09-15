import { Routes } from '@angular/router';
import { ReferenceDataComponent } from './reference-data.component';
import { NationalitiesComponent } from './components/nationalities/nationalities.component';
import { FrenchLevelsComponent } from './components/french-levels/french-levels.component';
import { GendersComponent } from './components/genders/genders.component';
import { ExitReasonsComponent } from './components/exit-reasons/exit-reasons.component';
import { OrientationsComponent } from './components/orientations/orientations.component';
import { StatusesComponent } from './components/statuses/statuses.component';
import { FinancingsComponent } from './components/financings/financings.component';
import { DisabilitiesComponent } from './components/disabilities/disabilities.component';

export const REFERENCE_DATA_ROUTES: Routes = [
  {
    path: '',
    component: ReferenceDataComponent,
    children: [
      {
        path: 'nationalities',
        component: NationalitiesComponent,
      },
      {
        path: 'french-levels',
        component: FrenchLevelsComponent,
      },
      {
        path: 'genders',
        component: GendersComponent,
      },
      {
        path: 'exit-reasons',
        component: ExitReasonsComponent,
      },
      {
        path: 'orientations',
        component: OrientationsComponent,
      },
      {
        path: 'statuses',
        component: StatusesComponent,
      },
      {
        path: 'financings',
        component: FinancingsComponent,
      },
      {
        path: 'disabilities',
        component: DisabilitiesComponent,
      },
    ],
  },
];
