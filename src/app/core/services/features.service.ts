import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FeatureCategory {
  title: string;
  description: string;
  icon: string;
  items: Array<{
    name: string;
    description?: string;
    status: string;
  }>;
}

export interface AppInfo {
  name: string;
  version: string;
  description: string;
  tagline: string;
  url: string;
  lastUpdated: string;
}

export interface TechStack {
  frontend: string[];
  backend: string[];
  deployment: string[];
  security: string[];
}

export interface Stats {
  totalFeatures: number;
  implementedFeatures: number;
  plannedFeatures: number;
  backlogFeatures: number;
}

export interface RecentUpdate {
  title: string;
  description: string;
  icon: string;
  items: Array<{
    name: string;
    description: string;
    status: string;
  }>;
}

export interface FeaturesData {
  application: AppInfo;
  features: {
    implemented: {
      [key: string]: FeatureCategory;
    };
    recentlyAdded: {
      [key: string]: RecentUpdate;
    };
    planned: {
      [key: string]: {
        title: string;
        description: string;
        icon: string;
        items: Array<{
          name: string;
          description: string;
          status: string;
        }>;
      };
    };
  };
  techStack: TechStack;
  stats: Stats;
}

@Injectable({
  providedIn: 'root'
})
export class FeaturesService {
  private featuresUrl = 'assets/features.json';

  constructor(private http: HttpClient) {}

  getFeatures(): Observable<FeaturesData> {
    return this.http.get<FeaturesData>(this.featuresUrl);
  }

  getFeaturesData(): Promise<FeaturesData> {
    return this.http.get<FeaturesData>(this.featuresUrl).toPromise() as Promise<FeaturesData>;
  }
}
