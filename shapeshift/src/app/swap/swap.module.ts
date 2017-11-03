import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {ShapeShiftCommonModule} from '../common/common.module';
import {SwapIconComponent} from './swap-icon/swap-icon.component';
import {QrCodeComponent} from './qr-code/qr-code.component';
import {SwapContainerComponent} from './swap-container/swap-container.component';
import {SwapInitiateComponent} from './swap-initiate/swap-initiate.component';
import {FlexLayoutModule} from '@angular/flex-layout';
import { TransferLinkComponent } from './transfer-link/transfer-link.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: '', component: SwapContainerComponent, children: [
        {path: '', redirectTo: 'swap', pathMatch: 'full'},
        {path: 'swap', component: SwapInitiateComponent},
        {path: 'insufficient-amount', component: QrCodeComponent},
        {path: 'transfer', component: TransferLinkComponent},
      ],
      },
    ]),
    ShapeShiftCommonModule,
    FlexLayoutModule,
  ],
  declarations: [
    SwapIconComponent,
    QrCodeComponent,
    SwapContainerComponent,
    SwapInitiateComponent,
    TransferLinkComponent,
  ],
})
export class SwapModule {
}