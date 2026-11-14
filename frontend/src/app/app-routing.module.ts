import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AccueilComponent } from './components/accueil/accueil.component';
import { GrilleComponent } from './components/grille/grille.component';
import { ElevesComponent } from './components/eleves/eleves.component';
import { LivretsComponent } from './components/livrets/livrets.component';
import { LivretComponent } from './components/livret/livret.component';
import { SeancesComponent } from './components/seances/seances.component';

const routes: Routes = [
  { path: '', redirectTo: 'accueil', pathMatch: 'full' },
  { path: 'accueil', component: AccueilComponent },
  { path: 'grille', component: GrilleComponent },
  { path: 'eleves', component: ElevesComponent },
  { path: 'livrets', component: LivretsComponent },
  { path: 'livret/:eleveId', component: LivretComponent },
  { path: 'seances', component: SeancesComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule { }
