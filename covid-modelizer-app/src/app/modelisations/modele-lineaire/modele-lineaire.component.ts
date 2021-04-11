import { Component, Input, OnInit } from '@angular/core';
import {ChartDataSets, ChartOptions, ChartType} from 'chart.js';
import {Label} from 'ng2-charts';
import {ModelisationsService} from '../modelisations.service';
import {DonneesReellesService} from '../../donnees-reelles/donnees-reelles.service';

const MODEL = 'LIN';

@Component({
  selector: 'app-modele-lineaire',
  templateUrl: './modele-lineaire.component.html',
  styleUrls: ['./modele-lineaire.component.css']
})
export class ModeleLineaireComponent implements OnInit {

  // vaccin ou cas
  @Input() categorie = '';
  titreGraphe = '';
  nbCasJ14: any = '';
  donneesReellesCumules: number[] | undefined;
  donneesModeliseesCumulees: number[] | undefined;
  labelDonneesReellesCumulees = '';
  labelDonneesModelisees = '';
  days: any[] | undefined;
  chartData: ChartDataSets[] | undefined;
  chartLabels: Label[] | undefined;
  chartOptions: ChartOptions | undefined;
  chartLegend = true;
  chartType: ChartType = 'bar';

  constructor(private modelisationsService: ModelisationsService, private donneesReellesService: DonneesReellesService) {
    this.donneesReellesCumules = new Array<number>();
    this.donneesModeliseesCumulees = new Array<number>();
  }

  ngOnInit(): void {
    this.days = [];
    this.setTitreGraphe();
    this.setChartLegends();
    this.setLabelCasOuVaccinsCumules();
    this.setLabelDonneesModelisees();
    this.getAllDataToDisplay();
    this.chartData = [
      { data: this.donneesReellesCumules, label: this.labelDonneesReellesCumulees },
      { data: this.donneesModeliseesCumulees, label: this.labelDonneesModelisees, type: 'line', lineTension: 0, fill: false }
    ];
    this.chartLabels = this.days;
  }

  /**
   * Labels des axes du graphe
   */
  setChartLegends() {
    this.chartOptions = {
      responsive: true,
      scales: {
        yAxes: [
         {
          display: true,
          scaleLabel: {
           display: true,
           labelString: this.categorie === 'vaccination' ? "Nombre de "+this.categorie : "Nombre de "+this.categorie+" positifs",
          },
         },
        ],
        xAxes: [
         {
          scaleLabel: {
           display: true,
           labelString: "Date",
          },
         },
        ],
       },
    };
  }

  setTitreGraphe(): void {
    if(this.categorie === 'vaccination') {
      this.titreGraphe = 'Comparaison vaccinations cumulées réelles et modélisées par jour';
    } else {
      this.titreGraphe = 'Comparaison infections cumulées réelles et modélisées par jour';
    }
  }

  setLabelCasOuVaccinsCumules(): void {
    if(this.categorie === 'vaccination') {
      this.labelDonneesReellesCumulees = 'Vaccinations réelles';
    } else {
      this.labelDonneesReellesCumulees = 'Infections réelles';
    }
  }

  setLabelDonneesModelisees(): void {
    if(this.categorie === 'vaccination') {
      this.labelDonneesModelisees = 'Vaccinations modélisées';
    } else {
      this.labelDonneesModelisees = 'Infections modélisées';
    }
  }

  getAllDataToDisplay(): void {
    // Date à partir de laquelle on commence la récupération des données réelles (date de la première prédiction)
    let dateDebutGraphe: any;

    // Récupération des données modélisées cumulées à afficher
    let donneesModeliseesCumulees = new Array<number>();
    if(this.categorie === 'vaccination' || this.categorie === 'infection') {
      this.modelisationsService.getDonneesModeliseesByModel(this.categorie, MODEL).subscribe(data => {
      dateDebutGraphe = data[0].date;
      this.nbCasJ14 = data[data.length-1].value - data[data.length-2].value;
      for(let elt of data) {
        donneesModeliseesCumulees.push(Number(elt.value));
        // Récupération de la plage de temps sur laquelle faire le graphe
        this.days?.push(elt.date);
      }
      });
    } else {
      // ERROR
      console.log('ERROR : categorie doit être égale à \'vaccin\' ou \'cas\' !');
    }
    this.donneesModeliseesCumulees = donneesModeliseesCumulees;

    // Récupération des données réelles cumulées à afficher
    let donneesReellesCumules = new Array<number>();
    this.donneesReellesService.getAllSituationsReelles().subscribe(data => {
      if(this.categorie === 'vaccination') {
        for(let elt of data) {
          // On ne récupère que les valeurs à partir de la date de la 1ère prédiction
          if(elt.date >= dateDebutGraphe) {
            donneesReellesCumules.push(Number(elt.cumulPremieresInjections));
          }
        }
      } else if(this.categorie === 'infection') {
        for(let elt of data) {
          if(elt.date >= dateDebutGraphe) {
            donneesReellesCumules.push(Number(elt.cumulCasConfirmes));
          }
        }
      } else {
        // ERROR
        console.log('ERROR : categorie doit être égale à \'vaccin\' ou \'cas\' !');
      }
    });
    this.donneesReellesCumules = donneesReellesCumules;
  }

  isConfinement(): string {
    if( this.nbCasJ14 > 30000){
      return "OUI";
    }
    return "NON";
  }

}
