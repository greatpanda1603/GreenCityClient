import { Component, OnDestroy, OnInit } from '@angular/core';
import { RestoreDto } from '../../../model/restroreDto';
import { ActivatedRoute } from '@angular/router';
import { ChangePasswordService } from '../../../service/auth/change-password.service';

@Component({
  selector: 'app-restore-form',
  templateUrl: './restore-form.component.html',
  styleUrls: ['./restore-form.component.css']
})
export class RestoreFormComponent implements OnInit, OnDestroy {
  passwordErrorMessageBackEnd: string;
  restoreDto: RestoreDto;
  loadingAnim = false;
  private sub: any;

  constructor(
    private route: ActivatedRoute,
    private changePasswordService: ChangePasswordService
  ) {}

  ngOnInit() {
    this.restoreDto = new RestoreDto();
    this.setNullAllMessage();
    this.sub = this.route.queryParamMap.subscribe(params => {
      this.restoreDto.token = params.get('token');
      this.restoreDto.userId = Number.parseInt(params.get('user_id'), 10);
    });
  }

  sendPasswords() {
    this.changePasswordService.changePassword(this.restoreDto);
  }

  private setNullAllMessage() {
    this.passwordErrorMessageBackEnd = null;
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
