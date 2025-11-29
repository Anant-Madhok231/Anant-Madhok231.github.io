/*
 * Canvas Grade Checker
 * Copyright (c) 2024
 * All rights reserved.
 * 
 * This software and associated documentation files (the "Software") are the
 * proprietary and confidential property of the owner. Unauthorized copying,
 * modification, distribution, or use of this Software, via any medium, is
 * strictly prohibited without the express written permission of the owner.
 */

let categories = [];
let gradingScale = {
    'A+': 97,
    'A': 93,
    'A-': 90,
    'B+': 87,
    'B': 83,
    'B-': 80,
    'C+': 77,
    'C': 73,
    'C-': 70,
    'D+': 67,
    'D': 60,
    'D-': 57,
    'F': 0
};

let targetGrade = 93;
let targetLetterGrade = 'A';

document.addEventListener('DOMContentLoaded', () => {
    setupGradingScaleListeners();
    setupThemeSelector();
    renderCategories();
    updateCalculations();
    
    const targetGradeSelect = document.getElementById('target-grade');
    targetGradeSelect.addEventListener('change', () => {
        targetLetterGrade = targetGradeSelect.value;
        updateTargetGradeDisplay();
    });
    
    updateTargetGradeDisplay();
});

function setupThemeSelector() {
    const themeSelector = document.getElementById('theme-selector');
    if (themeSelector) {
        themeSelector.addEventListener('change', (e) => {
            document.body.className = `theme-${e.target.value}`;
        });
    }
}

function updateTargetGradeDisplay() {
    targetGrade = gradingScale[targetLetterGrade] || 93;
    const display = document.getElementById('target-grade-percentage');
    if (display) {
        display.textContent = `${targetGrade.toFixed(1)}%`;
    }
    updateFutureAssignments();
}

function setupGradingScaleListeners() {
    Object.keys(gradingScale).forEach(grade => {
        const inputId = `scale-${grade.toLowerCase().replace('+', '-plus').replace('-', '-minus')}`;
        const input = document.getElementById(inputId);
        if (input) {
            input.value = gradingScale[grade];
            input.addEventListener('input', () => {
                gradingScale[grade] = parseFloat(input.value) || 0;
                updateCalculations();
                if (grade === targetLetterGrade) {
                    updateTargetGradeDisplay();
                }
            });
        }
    });
}

function renderCategories() {
    const container = document.getElementById('categories-container');
    container.innerHTML = '';

    categories.forEach((category, index) => {
        const categoryDiv = createCategoryElement(category, index);
        container.appendChild(categoryDiv);
    });

    updateTotalWeight();
    updateCalculations();
    updateFutureAssignments();
}

function createCategoryElement(category, index) {
    const div = document.createElement('div');
    div.className = 'component';
    div.dataset.index = index;

    const assignmentsHtml = category.assignments.map((assignment, assignIndex) => {
        const percentage = assignment.isFuture ? '?' : calculateAssignmentPercentage(assignment);
        return `
        <div class="assignment-entry ${assignment.isFuture ? 'future-assignment' : ''}">
            <div class="points-input-group">
                ${assignment.isFuture ? `
                    <span style="font-weight: 600; color: #666;">Score needed:</span>
                    <input type="number" class="points-total" value="${assignment.totalPoints}" min="0.1" step="0.1" placeholder="Out of" data-assign-index="${assignIndex}">
                    <span style="font-weight: 700; color: #ff6b9d;">?</span>
                ` : `
                    <input type="number" class="points-earned" value="${assignment.pointsEarned}" min="0" step="0.1" placeholder="Your score" data-assign-index="${assignIndex}">
                    <span style="font-weight: 700; color: #666;">/</span>
                    <input type="number" class="points-total" value="${assignment.totalPoints}" min="0.1" step="0.1" placeholder="Out of" data-assign-index="${assignIndex}">
                    <span class="assignment-percentage">${percentage.toFixed(1)}%</span>
                `}
            </div>
            <label class="future-checkbox-label">
                <input type="checkbox" class="future-checkbox" ${assignment.isFuture ? 'checked' : ''} data-assign-index="${assignIndex}">
                <span>Future</span>
            </label>
            <button class="remove-assignment" data-assign-index="${assignIndex}">×</button>
        </div>
    `;
    }).join('');

    const categoryPercentage = calculateCategoryPercentage(category);

    div.innerHTML = `
        <div class="component-header">
            <div class="component-title">${category.name}</div>
            <button class="remove-component">🗑️ Remove</button>
        </div>
        <div class="component-fields">
            <div class="form-group">
                <label>Category Name</label>
                <input type="text" class="category-name" value="${category.name}" placeholder="e.g., Homework, Quizzes">
            </div>
            <div class="form-group">
                <label>Weight (%)</label>
                <input type="number" class="category-weight" value="${category.weight}" min="0" max="100" step="0.1" placeholder="e.g., 20">
            </div>
        </div>
        <div style="margin-top: 20px;">
            <label style="display: block; margin-bottom: 10px; font-weight: 500;">Scores (Enter your score and out of how much)</label>
            <div class="assignments-container">
                ${assignmentsHtml}
                <button class="add-assignment-btn">+ Add Score</button>
            </div>
            <div class="category-stats" style="margin-top: 15px; padding: 12px; background: rgba(255, 107, 157, 0.1); border-radius: 8px;">
                <div><strong>Category Average:</strong> <span class="category-avg-value" style="color: #ff6b9d; font-size: 1.1em; font-weight: 700;">${categoryPercentage.toFixed(2)}%</span></div>
            </div>
        </div>
    `;

    const nameInput = div.querySelector('.category-name');
    const weightInput = div.querySelector('.category-weight');
    const addAssignmentBtn = div.querySelector('.add-assignment-btn');
    const removeBtn = div.querySelector('.remove-component');

    nameInput.addEventListener('input', () => {
        categories[index].name = nameInput.value;
        updateCalculations();
    });

    weightInput.addEventListener('input', () => {
        categories[index].weight = parseFloat(weightInput.value) || 0;
        updateTotalWeight();
        updateCalculations();
        updateFutureAssignments();
    });

    addAssignmentBtn.addEventListener('click', () => {
        categories[index].assignments.push({
            name: '',
            pointsEarned: 0,
            totalPoints: 100,
            isFuture: false
        });
        renderCategories();
    });

    removeBtn.addEventListener('click', () => {
        categories.splice(index, 1);
        renderCategories();
    });

    div.querySelectorAll('.points-earned').forEach(input => {
        input.addEventListener('input', () => {
            const assignIndex = parseInt(input.dataset.assignIndex);
            categories[index].assignments[assignIndex].pointsEarned = parseFloat(input.value) || 0;
            updateAssignmentDisplay(div, index, assignIndex);
            updateCalculations();
            updateFutureAssignments();
        });
    });

    div.querySelectorAll('.points-total').forEach(input => {
        input.addEventListener('input', () => {
            const assignIndex = parseInt(input.dataset.assignIndex);
            const total = parseFloat(input.value) || 1;
            categories[index].assignments[assignIndex].totalPoints = total;
            updateAssignmentDisplay(div, index, assignIndex);
            updateCalculations();
            updateFutureAssignments();
        });
    });

    div.querySelectorAll('.future-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const assignIndex = parseInt(checkbox.dataset.assignIndex);
            categories[index].assignments[assignIndex].isFuture = checkbox.checked;
            if (checkbox.checked) {
                categories[index].assignments[assignIndex].pointsEarned = 0;
            }
            renderCategories();
        });
    });

    div.querySelectorAll('.remove-assignment').forEach(btn => {
        btn.addEventListener('click', () => {
            const assignIndex = parseInt(btn.dataset.assignIndex);
            categories[index].assignments.splice(assignIndex, 1);
            renderCategories();
        });
    });

    return div;
}

function calculateAssignmentPercentage(assignment) {
    if (!assignment.totalPoints || assignment.totalPoints === 0) return 0;
    return (assignment.pointsEarned / assignment.totalPoints) * 100;
}

function calculateCategoryPercentage(category) {
    const completedAssignments = category.assignments.filter(a => !a.isFuture);
    if (completedAssignments.length === 0) return 0;
    let totalEarned = 0;
    let totalPossible = 0;
    completedAssignments.forEach(assign => {
        totalEarned += assign.pointsEarned || 0;
        totalPossible += assign.totalPoints || 0;
    });
    if (totalPossible === 0) return 0;
    return (totalEarned / totalPossible) * 100;
}

function updateAssignmentDisplay(categoryDiv, categoryIndex, assignIndex) {
    const assignment = categories[categoryIndex].assignments[assignIndex];
    if (!assignment.isFuture) {
        const percentage = calculateAssignmentPercentage(assignment);
        const percentageSpan = categoryDiv.querySelector(`.assignment-entry:nth-child(${assignIndex + 1}) .assignment-percentage`);
        if (percentageSpan && !percentageSpan.classList.contains('future-percentage')) {
            percentageSpan.textContent = `${percentage.toFixed(2)}%`;
        }
    }
    const categoryAvg = categoryDiv.querySelector('.category-avg-value');
    if (categoryAvg) {
        categoryAvg.textContent = `${calculateCategoryPercentage(categories[categoryIndex]).toFixed(2)}%`;
    }
}

function updateTotalWeight() {
    const total = categories.reduce((sum, cat) => sum + (parseFloat(cat.weight) || 0), 0);
    const totalWeightEl = document.getElementById('total-weight');
    totalWeightEl.textContent = total.toFixed(1);
    
    const weightTotalDiv = totalWeightEl.closest('.weight-total');
    weightTotalDiv.classList.remove('warning', 'error');
    
    if (total > 100) {
        weightTotalDiv.classList.add('error');
    } else if (total < 100 && total > 0) {
        weightTotalDiv.classList.add('warning');
    }
}

function updateCalculations() {
    calculateCurrentGrade();
    updateLetterGrade();
}

function calculateCurrentGrade() {
    let totalPoints = 0;
    let totalWeight = 0;

    categories.forEach(category => {
        const weight = parseFloat(category.weight) || 0;
        if (weight > 0) {
            const categoryPercentage = calculateCategoryPercentage(category);
            const completedAssignments = category.assignments.filter(a => !a.isFuture);
            if (completedAssignments.length > 0) {
                totalPoints += (categoryPercentage * weight) / 100;
                totalWeight += weight;
            }
        }
    });

    const currentPercentage = totalWeight > 0 ? (totalPoints / totalWeight) * 100 : 0;
    
    document.getElementById('current-percentage').textContent = currentPercentage.toFixed(2) + '%';
    document.getElementById('current-grade').textContent = currentPercentage.toFixed(2);
}

function updateLetterGrade() {
    const currentPercentage = parseFloat(document.getElementById('current-percentage').textContent) || 0;
    const letterGradeEl = document.getElementById('letter-grade');
    
    let letterGrade = 'F';
    const sortedGrades = Object.entries(gradingScale)
        .sort((a, b) => b[1] - a[1]);
    
    for (const [grade, threshold] of sortedGrades) {
        if (currentPercentage >= threshold) {
            letterGrade = grade;
            break;
        }
    }
    
    letterGradeEl.textContent = letterGrade;
}

function updateFutureAssignments() {
    const resultDiv = document.getElementById('future-assignments-result');
    
    const futureAssignments = [];
    categories.forEach((category, catIndex) => {
        category.assignments.forEach((assignment, assignIndex) => {
            if (assignment.isFuture) {
                futureAssignments.push({
                    category: category,
                    categoryIndex: catIndex,
                    assignment: assignment,
                    assignIndex: assignIndex
                });
            }
        });
    });
    
    if (futureAssignments.length === 0) {
        resultDiv.innerHTML = '<p style="color: #666; font-style: italic;">No future scores marked. Check the "Future" box on scores you haven\'t taken yet!</p>';
        resultDiv.classList.add('show');
        return;
    }
    
    let resultHtml = '<h3>🎯 What You Need on Future Scores</h3>';
    
    futureAssignments.forEach(({ category, categoryIndex, assignment, assignIndex }) => {
        const result = calculateNeededAssignmentScore(targetGrade, categoryIndex, assignIndex);
        
        if (result.error) {
            resultHtml += `<div style="padding: 10px; margin: 10px 0; background: #fff3cd; border-radius: 8px; color: #856404;">
                ${category.name}: ${result.error}
            </div>`;
        } else if (result.neededScore < 0) {
            resultHtml += `<div style="padding: 12px; margin: 10px 0; background: #d4edda; border-radius: 8px; border-left: 4px solid #28a745;">
                ${category.name}: 🎉 You've already achieved your target! You could score 0% and still maintain ${targetGrade.toFixed(2)}%.
            </div>`;
        } else if (result.neededScore > 100) {
            resultHtml += `<div style="padding: 12px; margin: 10px 0; background: #f8d7da; border-radius: 8px; border-left: 4px solid #dc3545;">
                ${category.name}: 😅 You'd need ${result.neededScore.toFixed(1)}% (${result.neededPoints.toFixed(1)}/${assignment.totalPoints} points), which is impossible. Try a lower target grade.
            </div>`;
        } else {
            resultHtml += `<div style="padding: 12px; margin: 10px 0; background: #d1ecf1; border-radius: 8px; border-left: 4px solid #0dcaf0;">
                <div style="font-size: 1.1em; margin-bottom: 5px;"><strong>${category.name}</strong></div>
                <div style="font-size: 1.3em; font-weight: 700; color: #ff6b9d;">You need: <strong>${result.neededScore.toFixed(1)}%</strong></div>
                <div style="font-size: 1.1em; margin-top: 5px;">That's <strong>${result.neededPoints.toFixed(1)} out of ${assignment.totalPoints}</strong> points!</div>
            </div>`;
        }
    });
    
    resultDiv.innerHTML = resultHtml;
    resultDiv.classList.add('show');
    updateFutureAssignmentsDisplay();
}

function calculateNeededAssignmentScore(targetGrade, categoryIndex, assignmentIndex) {
    const category = categories[categoryIndex];
    const assignment = category.assignments[assignmentIndex];
    const categoryWeight = parseFloat(category.weight) || 0;
    
    if (categoryWeight === 0) {
        return { error: 'Category has 0% weight. Set a weight first.' };
    }
    
    let currentPoints = 0;
    let totalWeight = 0;
    
    categories.forEach((cat, catIndex) => {
        const weight = parseFloat(cat.weight) || 0;
        totalWeight += weight;
        if (catIndex === categoryIndex) {
            let catEarned = 0;
            let catTotal = 0;
            cat.assignments.forEach((assign, assignIdx) => {
                if (assignIdx !== assignmentIndex && !assign.isFuture) {
                    catEarned += assign.pointsEarned || 0;
                    catTotal += assign.totalPoints || 0;
                }
            });
            if (catTotal > 0) {
                const catPercentage = (catEarned / catTotal) * 100;
                currentPoints += (catPercentage * weight) / 100;
            }
        } else {
            const catPercentage = calculateCategoryPercentage(cat);
            const completedAssignments = cat.assignments.filter(a => !a.isFuture);
            if (completedAssignments.length > 0) {
                currentPoints += (catPercentage * weight) / 100;
            }
        }
    });
    
    const neededCategoryPercentage = ((targetGrade / 100) * totalWeight - currentPoints) / categoryWeight * 100;
    
    let otherEarned = 0;
    let otherTotal = 0;
    category.assignments.forEach((assign, idx) => {
        if (idx !== assignmentIndex && !assign.isFuture) {
            otherEarned += assign.pointsEarned || 0;
            otherTotal += assign.totalPoints || 0;
        }
    });
    
    const totalCategoryPoints = otherTotal + assignment.totalPoints;
    if (totalCategoryPoints === 0) {
        return { error: 'Cannot calculate: total points is 0' };
    }
    
    const neededEarned = (neededCategoryPercentage / 100) * totalCategoryPoints - otherEarned;
    const neededPercentage = (neededEarned / assignment.totalPoints) * 100;
    
    return {
        neededScore: neededPercentage,
        neededPoints: neededEarned,
        totalPoints: assignment.totalPoints
    };
}

function updateFutureAssignmentsDisplay() {
    categories.forEach((category, catIndex) => {
        category.assignments.forEach((assignment, assignIndex) => {
            if (assignment.isFuture) {
                const result = calculateNeededAssignmentScore(targetGrade, catIndex, assignIndex);
                if (!result.error && result.neededScore >= 0 && result.neededScore <= 100) {
                    const categoryDiv = document.querySelector(`[data-index="${catIndex}"]`);
                    if (categoryDiv) {
                        const assignDiv = categoryDiv.querySelector(`.assignment-entry:nth-child(${assignIndex + 1})`);
                        if (assignDiv) {
                            const percentageSpan = assignDiv.querySelector('.future-percentage');
                            if (percentageSpan) {
                                percentageSpan.textContent = `${result.neededScore.toFixed(1)}%`;
                                percentageSpan.style.color = '#ff6b9d';
                            }
                        }
                    }
                }
            }
        });
    });
}

document.getElementById('add-category-btn').addEventListener('click', () => {
    categories.push({
        name: 'New Category',
        weight: 0,
        assignments: []
    });
    renderCategories();
    setTimeout(() => {
        const newCategory = document.querySelectorAll('.category-name');
        if (newCategory.length > 0) {
            newCategory[newCategory.length - 1].focus();
            newCategory[newCategory.length - 1].select();
        }
    }, 100);
});
