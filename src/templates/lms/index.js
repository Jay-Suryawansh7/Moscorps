const fs = require("fs-extra");
const path = require("path");

async function generateLMSTemplate(projectDir, options) {
  console.log("📚 Generating LMS template...");

  const modelsDir = path.join(projectDir, "src/models");
  const routesDir = path.join(projectDir, "src/routes");
  const controllersDir = path.join(projectDir, "src/controllers");

  // Course model
  await fs.writeFile(
    path.join(modelsDir, "Course.ts"),
    `import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class Course extends Model {
  id!: number;
  instructorId!: number;
  title!: string;
  description?: string;
  price!: number;
  status!: 'draft' | 'published' | 'archived';
}

Course.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  instructorId: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  price: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  status: { type: DataTypes.ENUM('draft', 'published', 'archived'), defaultValue: 'draft' }
}, { sequelize, tableName: 'courses', timestamps: true });

export default Course;
`,
  );

  // Enrollment model
  await fs.writeFile(
    path.join(modelsDir, "Enrollment.ts"),
    `import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class Enrollment extends Model {
  id!: number;
  courseId!: number;
  studentId!: number;
  progress!: number;
  status!: 'active' | 'completed' | 'dropped';
}

Enrollment.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  courseId: { type: DataTypes.INTEGER, allowNull: false },
  studentId: { type: DataTypes.INTEGER, allowNull: false },
  progress: { type: DataTypes.INTEGER, defaultValue: 0 },
  status: { type: DataTypes.ENUM('active', 'completed', 'dropped'), defaultValue: 'active' }
}, { sequelize, tableName: 'enrollments', timestamps: true });

export default Enrollment;
`,
  );

  // Lesson model
  await fs.writeFile(
    path.join(modelsDir, "Lesson.ts"),
    `import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class Lesson extends Model {
  id!: number;
  courseId!: number;
  title!: string;
  content?: string;
  videoUrl?: string;
  order!: number;
  duration?: number;
}

Lesson.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  courseId: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  content: { type: DataTypes.TEXT },
  videoUrl: { type: DataTypes.STRING },
  order: { type: DataTypes.INTEGER, defaultValue: 0 },
  duration: { type: DataTypes.INTEGER }
}, { sequelize, tableName: 'lessons', timestamps: true });

export default Lesson;
`,
  );

  // Quiz model
  await fs.writeFile(
    path.join(modelsDir, "Quiz.ts"),
    `import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class Quiz extends Model {
  id!: number;
  lessonId!: number;
  title!: string;
  passingScore!: number;
}

Quiz.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  lessonId: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  passingScore: { type: DataTypes.INTEGER, defaultValue: 70 }
}, { sequelize, tableName: 'quizzes', timestamps: true });

export default Quiz;
`,
  );

  // Routes
  const courseRoutes = `import { Router } from 'express';
import * as courseController from '../controllers/course.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
router.get('/', courseController.list);
router.get('/:id', courseController.getOne);
router.post('/', authenticate, courseController.create);
router.put('/:id', authenticate, courseController.update);
router.delete('/:id', authenticate, courseController.deleteOne);
export default router;
`;

  await fs.writeFile(path.join(routesDir, "course.routes.ts"), courseRoutes);

  // Controllers
  const courseController = `import { Request, Response, NextFunction } from 'express';
import Course from '../models/Course.js';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const courses = await Course.findAll({ 
      where: { status: 'published' },
      limit: 20
    });
    res.json({ courses });
  } catch (error) { next(error); }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json({ course });
  } catch (error) { next(error); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const course = await Course.create({ ...req.body, instructorId: req.user?.userId });
    res.status(201).json({ course });
  } catch (error) { next(error); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    await course.update(req.body);
    res.json({ course });
  } catch (error) { next(error); }
}

export async function deleteOne(req: Request, res: Response, next: NextFunction) {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    await course.destroy();
    res.json({ message: 'Course deleted' });
  } catch (error) { next(error); }
}
`;

  await fs.writeFile(
    path.join(controllersDir, "course.controller.ts"),
    courseController,
  );

  console.log("✅ LMS template generated!");
}

module.exports = { generateLMSTemplate };
