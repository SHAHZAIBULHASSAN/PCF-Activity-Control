// Import necessary dependencies
import { IInputs, IOutputs } from "./generated/ManifestTypes";

// Import the CSS file for styling
import './css/style.css';

export class ActivityTimelineControl implements ComponentFramework.StandardControl<IInputs, IOutputs> {
    private container: HTMLDivElement;
    private activityDataset: ComponentFramework.PropertyTypes.DataSet;
    private currentPage: number = 1; // Current page number
    private pageSize: number = 3;   // Number of records per page

    constructor() {}

    /**
     * Initialize the control
     */
    public init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary, container: HTMLDivElement): void {
        this.container = container;
    }

    /**
     * Update the view with new data
     */
    public updateView(context: ComponentFramework.Context<IInputs>): void {
        this.activityDataset = context.parameters.activityDataset;

        // Check if dataset is empty
        if (!this.activityDataset || !this.activityDataset.sortedRecordIds || this.activityDataset.sortedRecordIds.length === 0) {
            this.container.innerHTML = "<div class='no-activities'>No activities found</div>";
            return;
        }

        // Sort records by the latest start date
        const sortedRecords = [...this.activityDataset.sortedRecordIds].sort((a, b) => {
            const dateA = new Date(this.activityDataset.records[a].getFormattedValue("scheduledstart") || "").getTime();
            const dateB = new Date(this.activityDataset.records[b].getFormattedValue("scheduledstart") || "").getTime();
            return dateB - dateA; // Descending order (latest first)
        });

        // Get the total number of records
        const totalRecords = sortedRecords.length;

        // Calculate the start and end indices for the current page
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = Math.min(startIndex + this.pageSize, totalRecords);

        // Slice the dataset to display only the records for the current page
        const paginatedRecords = sortedRecords.slice(startIndex, endIndex);

        // Generate the timeline HTML for the current page
        const timelineHTML = `
            <div class="timeline-container">
                ${paginatedRecords.map((id) => {
                    const record = this.activityDataset.records[id];
                    const subject = record.getFormattedValue("subject") || "No Subject";
                    const startDate = record.getFormattedValue("scheduledstart") || "No Start Date";
                    const endDate = record.getFormattedValue("scheduledend") || "No End Date";
                    const statusCode = record.getValue("statuscode") as number;
                    const description = record.getFormattedValue("description") || "No Description";
                    const statusColor = this.getStatusColor(statusCode);

                    return `
                        <div class="timeline-item">
                            <div class="timeline-dates">
                                <div class="date"><strong>Start:</strong> ${startDate}</div>
                                <div class="date"><strong>End:</strong> ${endDate}</div>
                            </div>
                            <div class="timeline-content" style="border-left: 4px solid ${statusColor};">
                                <div class="subject">${subject}</div>
                                <div class="description">${description}</div>
                                <div class="status">
                                    <div class="status-indicator" style="background-color: ${statusColor};"></div>
                                </div>
                            </div>
                        </div>
                    `;
                }).join("")}
            </div>
            <div class="pagination-controls">
                <button id="prev-page" ${this.currentPage === 1 ? 'disabled' : ''}>Previous</button>
                <span>Page ${this.currentPage} of ${Math.ceil(totalRecords / this.pageSize)}</span>
                <button id="next-page" ${endIndex >= totalRecords ? 'disabled' : ''}>Next</button>
            </div>
        `;

        // Render the timeline and pagination controls
        this.container.innerHTML = timelineHTML;

        // Add event listeners for pagination buttons
        const prevButton = this.container.querySelector('#prev-page') as HTMLButtonElement;
        const nextButton = this.container.querySelector('#next-page') as HTMLButtonElement;

        if (prevButton) {
            prevButton.addEventListener('click', () => {
                this.currentPage--;
                this.updateView(context);
            });
        }

        if (nextButton) {
            nextButton.addEventListener('click', () => {
                this.currentPage++;
                this.updateView(context);
            });
        }
    }

    /**
     * Helper function to assign colors based on status code
     */
    private getStatusColor(statusCode: number): string {
        switch (statusCode) {
            case 0: // Completed
                return "#28a745"; // Green
            case 1: // In Progress
                return "#ffc107"; // Yellow
            case 2: // Canceled
                return "#dc3545"; // Red
            default:
                return "#6c757d"; // Gray (Default)
        }
    }

    /**
     * Get outputs (required by the interface)
     */
    public getOutputs(): IOutputs {
        return {};
    }

    /**
     * Clean up resources (required by the interface)
     */
    public destroy(): void {
        this.container.innerHTML = "";
    }
}