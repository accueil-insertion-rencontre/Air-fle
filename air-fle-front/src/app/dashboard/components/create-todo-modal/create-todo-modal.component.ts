import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import {
  CreateTodoRequest,
  TodoTask,
  CreateTodoWithSubtasksRequest,
  SubtaskRequest,
} from '@core/services';

@Component({
  selector: 'app-create-todo-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-todo-modal.component.html',
  styleUrls: ['./create-todo-modal.component.scss'],
})
export class CreateTodoModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() parentTasks: TodoTask[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() submit = new EventEmitter<CreateTodoWithSubtasksRequest>();

  todoForm!: FormGroup;
  isSubmitting = false;
  hasSubtasks = false;

  constructor(private fb: FormBuilder) {
    this.initializeForm();
  }

  /**
   * Initialise le formulaire avec ses valeurs par défaut
   */
  private initializeForm() {
    this.todoForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      dueAt: [''],
      parentTaskId: [''],
      hasSubtasks: [true],
      subtasks: this.fb.array([]),
    });

    this.hasSubtasks = true;
    this.addSubtask();
  }

  /**
   * Réinitialise complètement le formulaire
   */
  private resetForm() {
    // Vider complètement le FormArray des sous-tâches
    while (this.subtasks.length !== 0) {
      this.subtasks.removeAt(0);
    }

    // Réinitialiser le formulaire
    this.todoForm.reset({
      title: '',
      description: '',
      dueAt: '',
      parentTaskId: '',
      hasSubtasks: true,
    });

    // Réajouter une sous-tâche vide
    this.addSubtask();
    this.isSubmitting = false;
  }

  onSubmit() {
    const isFormValidForSubmission = this.isMainFormValid();

    if (isFormValidForSubmission && !this.isSubmitting) {
      this.isSubmitting = true;

      const formValue = this.todoForm.value;

      // Préparer les sous-tâches
      const subtasks: SubtaskRequest[] = [];
      this.subtasks.controls.forEach(control => {
        const subtaskValue = control.value;
        if (subtaskValue.title?.trim()) {
          subtasks.push({
            title: subtaskValue.title.trim(),
            description: subtaskValue.description?.trim() || undefined,
          });
        }
      });

      // Vérifier qu'on a au moins une sous-tâche
      if (subtasks.length === 0) {
        this.isSubmitting = false;
        return;
      }

      const todoData: CreateTodoWithSubtasksRequest = {
        title: formValue.title?.trim(),
        description: formValue.description?.trim() || undefined,
        subtasks: subtasks,
      };

      this.submit.emit(todoData);

      // Réinitialiser le formulaire après soumission
      setTimeout(() => {
        this.resetForm();
      }, 100);
    }
  }

  onClose() {
    this.resetForm();
    this.close.emit();
  }

  // Empêcher la fermeture quand on clique sur le contenu de la modal
  onModalContentClick(event: Event) {
    event.stopPropagation();
  }

  get title() {
    return this.todoForm.get('title');
  }
  get description() {
    return this.todoForm.get('description');
  }
  get dueAt() {
    return this.todoForm.get('dueAt');
  }
  get hasSubtasksControl() {
    return this.todoForm.get('hasSubtasks');
  }
  get subtasks() {
    return this.todoForm.get('subtasks') as FormArray;
  }

  /**
   * Validation personnalisée du formulaire
   */
  isMainFormValid(): boolean {
    const titleValid = this.title?.valid;
    const descriptionValid = this.description?.valid;
    const dueAtValid = this.dueAt?.valid;

    // Vérifier qu'au moins une sous-tâche a un titre valide
    const hasValidSubtask =
      this.subtasks.length > 0 &&
      this.subtasks.controls.some(control => {
        const titleControl = control.get('title');
        return titleControl?.value?.trim() && titleControl.valid;
      });

    return !!(titleValid && descriptionValid && dueAtValid && hasValidSubtask);
  }

  /**
   * Ajoute une nouvelle sous-tâche au formulaire
   */
  addSubtask() {
    const subtaskGroup = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(300)]],
    });
    this.subtasks.push(subtaskGroup);
  }

  /**
   * Supprime une sous-tâche du formulaire
   */
  removeSubtask(index: number) {
    this.subtasks.removeAt(index);
  }

  onHasSubtasksChange() {
    // Méthode conservée pour compatibilité mais non utilisée
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && changes['isOpen'].currentValue) {
      this.resetForm();
    }
  }
}
