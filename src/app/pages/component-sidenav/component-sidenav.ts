import {
  Component,
  Input,
  NgModule,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';
import {DocumentationItems} from '../../shared/documentation-items/documentation-items';
import {MatIconModule} from '@angular/material/icon';
import {MatSidenav, MatSidenavModule} from '@angular/material/sidenav';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ActivatedRoute, Params, Router, RouterModule} from '@angular/router';
import {CommonModule} from '@angular/common';
import {ComponentHeaderModule} from '../component-page-header/component-page-header';
import {FooterModule} from '../../shared/footer/footer';
import {combineLatest, Observable, Subject} from 'rxjs';
import {map, takeUntil} from 'rxjs/operators';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {CdkAccordionModule} from '@angular/cdk/accordion';
import {BreakpointObserver} from '@angular/cdk/layout';

const SMALL_WIDTH_BREAKPOINT = 720;

@Component({
  selector: 'app-component-sidenav',
  templateUrl: './component-sidenav.html',
  styleUrls: ['./component-sidenav.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class ComponentSidenav implements OnInit {
  @ViewChild(MatSidenav) sidenav!: MatSidenav;
  params: Observable<Params> | undefined;
  isScreenSmall: Observable<boolean>;

  constructor(public docItems: DocumentationItems,
              private _route: ActivatedRoute,
              zone: NgZone,
              breakpoints: BreakpointObserver) {
    this.isScreenSmall = breakpoints.observe(`(max-width: ${SMALL_WIDTH_BREAKPOINT}px)`)
        .pipe(map(breakpoint => breakpoint.matches));
  }

  ngOnInit() {
    // Combine params from all of the path into a single object.
    this.params = combineLatest(
      this._route.pathFromRoot.map(route => route.params),
      Object.assign);
  }
}

@Component({
  selector: 'app-component-nav',
  templateUrl: './component-nav.html',
  animations: [
    trigger('bodyExpansion', [
      state('collapsed', style({height: '0px', display: 'none'})),
      state('expanded', style({height: '*', display: 'block'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4,0.0,0.2,1)')),
    ]),
  ],
})
export class ComponentNav implements OnInit, OnDestroy, OnChanges {
  @Input() params: Observable<Params> | undefined;
  expansions: {[key: string]: boolean} = {};
  private _destroyed = new Subject();

  constructor(public docItems: DocumentationItems, private _router: Router) {}

  ngOnInit() {
    if (this.params) {
      this.subscribeToParamChanges(this.params);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.params && changes.params.currentValue &&
        (changes.params.currentValue != changes.params.previousValue)) {
      this.subscribeToParamChanges(
          (changes.params.currentValue as Observable<Params>));
    }
  }

  subscribeToParamChanges(newParams: Observable<Params>) {
    newParams.pipe(takeUntil(this._destroyed))
        .subscribe(params => this.setExpansions(params));
  }

  ngOnDestroy() {
    this._destroyed.next();
    this._destroyed.complete();
  }

  /** Set the expansions based on the route url */
  setExpansions(params: Params) {
    const categories = this.docItems.getCategories(params.section);
    for (const category of (categories || [])) {
      if (this.expansions[category.id]) {
        continue;
      }

      let match = false;
      for (const item of category.items) {
        if (this._router.url.indexOf(item.id) > -1) {
          match = true;
          break;
        }
      }

      if (!this.expansions[category.id]) {
        this.expansions[category.id] = match;
      }
    }
  }

  /** Gets the expanded state */
  _getExpandedState(category: string) {
    return this.getExpanded(category) ? 'expanded' : 'collapsed';
  }

  /** Toggles the expanded state */
  toggleExpand(category: string) {
    this.expansions[category] = !this.expansions[category];
  }

  /** Gets whether expanded or not */
  getExpanded(category: string): boolean {
    return this.expansions[category] === undefined ? true : this.expansions[category];
  }
}


@NgModule({
  imports: [
    MatSidenavModule,
    RouterModule,
    CommonModule,
    ComponentHeaderModule,
    FooterModule,
    BrowserAnimationsModule,
    MatIconModule,
    CdkAccordionModule
  ],
  exports: [ComponentSidenav],
  declarations: [ComponentSidenav, ComponentNav],
  providers: [DocumentationItems],
})
export class ComponentSidenavModule {}
