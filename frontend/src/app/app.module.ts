import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

// Angular Material
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AccueilComponent } from './components/accueil/accueil.component';
import { GrilleComponent } from './components/grille/grille.component';
import { ElevesComponent } from './components/eleves/eleves.component';
import { LivretComponent } from './components/livret/livret.component';
import { LivretsComponent } from './components/livrets/livrets.component';
import { CommentairePopupComponent } from './components/commentaire-popup/commentaire-popup.component';
import { EleveFormComponent } from './components/eleve-form/eleve-form.component';
import { RadarChartComponent } from './components/radar-chart/radar-chart.component';
import { SeancesComponent } from './components/seances/seances.component';

@NgModule({
  declarations: [
    AppComponent,
    AccueilComponent,
    GrilleComponent,
    ElevesComponent,
    LivretComponent,
    LivretsComponent,
    CommentairePopupComponent,
    EleveFormComponent,
    RadarChartComponent,
    SeancesComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    AppRoutingModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSlideToggleModule,
    MatChipsModule,
    MatSidenavModule,
    MatListModule,
    MatTabsModule,
    MatSelectModule,
  ],
  providers: [provideHttpClient()],
  bootstrap: [AppComponent],
})
export class AppModule { }
