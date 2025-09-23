import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LogoComponent } from '../../shared/logo/logo';
import { FooterComponent } from '../../shared/footer/footer';
import { FeaturesService, FeatureCategory, AppInfo, TechStack, Stats, RecentUpdate, FeaturesData } from '../../core/services/features.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, LogoComponent, FooterComponent],
  templateUrl: './landing.html',
  styleUrls: ['./landing.scss']
})
export class LandingComponent implements OnInit {
  app: AppInfo | null = null;
  stats: Stats | null = null;
  featureCategories: FeatureCategory[] = [];
  recentUpdates: RecentUpdate[] = [];
  techStack: TechStack | null = null;
  loading = true;
  error: string | null = null;

  constructor(
    private router: Router,
    private featuresService: FeaturesService
  ) {}

  async ngOnInit() {
    try {
      const data: FeaturesData = await this.featuresService.getFeaturesData();

      this.app = data.application;
      this.stats = data.stats;
      this.featureCategories = Object.values(data.features.implemented);
      this.recentUpdates = Object.values(data.features.recentlyAdded);
      this.techStack = data.techStack;

      this.loading = false;
    } catch (error) {
      console.error('Error loading features data:', error);
      this.error = 'Failed to load features data. Please try again later.';
      this.loading = false;
    }
  }

  navigateToSignup() {
    this.router.navigate(['/signup']);
  }

  navigateToSignin() {
    this.router.navigate(['/signin']);
  }
}
