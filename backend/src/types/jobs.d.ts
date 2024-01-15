import { CronStatus, Domains, Timing, links_timing } from '@prisma/client';

export interface LinkList {
    name: string;
    url: string;
    isActive: boolean;
    timing: Timing;
    hasConfigChanged: boolean;
    domainId: number;
    domain: Domains;
}

export interface JobData {
    uuid: string;
    status: CronStatus;
    startTime: Date;
    endTime?: Date;
    links: LinkList[]; // Array of links to be processed
}

export interface SingleLinkJobData {
    uuid: string;
    status: CronStatus;
    startTime: Date;
    endTime?: Date;
    hash: string;
    timing: links_timing;
}
