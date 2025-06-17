import { 
  users, accidents, witnesses, fragments, materialEvidence, causeTrees, files,
  type User, type InsertUser, type Accident, type InsertAccident,
  type Witness, type InsertWitness, type Fragment, type InsertFragment,
  type MaterialEvidence, type InsertMaterialEvidence,
  type CauseTree, type InsertCauseTree, type File, type InsertFile
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;
  getUserStats(userId: number): Promise<{
    totalAnalyses: number;
    inProgress: number;
    completed: number;
    monthlyUsage: number;
    storageUsed: number;
  }>;

  // Accident operations
  getAccident(id: number): Promise<Accident | undefined>;
  getAccidentsByUser(userId: number): Promise<Accident[]>;
  createAccident(accident: InsertAccident & { accidentNumber: string }): Promise<Accident>;
  updateAccident(id: number, updates: Partial<Accident>): Promise<Accident>;
  deleteAccident(id: number): Promise<void>;
  getAccidentCountForYear(year: number): Promise<number>;

  // Witness operations
  getWitness(id: number): Promise<Witness | undefined>;
  getWitnessesByAccident(accidentId: number): Promise<Witness[]>;
  createWitness(witness: InsertWitness): Promise<Witness>;
  updateWitness(id: number, updates: Partial<Witness>): Promise<Witness>;
  deleteWitness(id: number): Promise<void>;

  // Fragment operations
  getFragment(id: number): Promise<Fragment | undefined>;
  getFragmentsByAccident(accidentId: number): Promise<Fragment[]>;
  createFragment(fragment: InsertFragment): Promise<Fragment>;
  updateFragment(id: number, updates: Partial<Fragment>): Promise<Fragment>;
  deleteFragment(id: number): Promise<void>;

  // Material evidence operations
  getMaterialEvidence(id: number): Promise<MaterialEvidence | undefined>;
  getMaterialEvidenceByAccident(accidentId: number): Promise<MaterialEvidence[]>;
  createMaterialEvidence(evidence: InsertMaterialEvidence): Promise<MaterialEvidence>;
  updateMaterialEvidence(id: number, updates: Partial<MaterialEvidence>): Promise<MaterialEvidence>;
  deleteMaterialEvidence(id: number): Promise<void>;

  // Cause tree operations
  getCauseTree(id: number): Promise<CauseTree | undefined>;
  getCauseTreeByAccident(accidentId: number): Promise<CauseTree | undefined>;
  createCauseTree(causeTree: InsertCauseTree): Promise<CauseTree>;
  updateCauseTree(id: number, updates: Partial<CauseTree>): Promise<CauseTree>;
  deleteCauseTree(id: number): Promise<void>;

  // File operations
  getFile(id: number): Promise<File | undefined>;
  getFilesByAccident(accidentId: number): Promise<File[]>;
  createFile(file: InsertFile): Promise<File>;
  deleteFile(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private accidents: Map<number, Accident> = new Map();
  private witnesses: Map<number, Witness> = new Map();
  private fragments: Map<number, Fragment> = new Map();
  private materialEvidence: Map<number, MaterialEvidence> = new Map();
  private causeTrees: Map<number, CauseTree> = new Map();
  private files: Map<number, File> = new Map();
  
  private currentUserId = 1;
  private currentAccidentId = 1;
  private currentWitnessId = 1;
  private currentFragmentId = 1;
  private currentEvidenceId = 1;
  private currentCauseTreeId = 1;
  private currentFileId = 1;

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
      role: insertUser.role || "user",
      plan: insertUser.plan || "free",
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getUserStats(userId: number): Promise<{
    totalAnalyses: number;
    inProgress: number;
    completed: number;
    monthlyUsage: number;
    storageUsed: number;
  }> {
    const userAccidents = Array.from(this.accidents.values()).filter(acc => acc.userId === userId);
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyAccidents = userAccidents.filter(acc => {
      const accDate = new Date(acc.createdAt);
      return accDate.getMonth() === currentMonth && accDate.getFullYear() === currentYear;
    });

    const userFiles = Array.from(this.files.values()).filter(file => {
      const accident = this.accidents.get(file.accidentId);
      return accident?.userId === userId;
    });

    const storageUsed = userFiles.reduce((total, file) => total + (file.fileSize || 0), 0);

    return {
      totalAnalyses: userAccidents.length,
      inProgress: userAccidents.filter(acc => acc.status === "in_progress").length,
      completed: userAccidents.filter(acc => acc.status === "completed").length,
      monthlyUsage: monthlyAccidents.length,
      storageUsed,
    };
  }

  // Accident operations
  async getAccident(id: number): Promise<Accident | undefined> {
    return this.accidents.get(id);
  }

  async getAccidentsByUser(userId: number): Promise<Accident[]> {
    return Array.from(this.accidents.values())
      .filter(accident => accident.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createAccident(accidentData: InsertAccident & { accidentNumber: string }): Promise<Accident> {
    const id = this.currentAccidentId++;
    const accident: Accident = {
      ...accidentData,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.accidents.set(id, accident);
    return accident;
  }

  async updateAccident(id: number, updates: Partial<Accident>): Promise<Accident> {
    const accident = this.accidents.get(id);
    if (!accident) throw new Error("Accident not found");
    
    const updatedAccident = { 
      ...accident, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.accidents.set(id, updatedAccident);
    return updatedAccident;
  }

  async deleteAccident(id: number): Promise<void> {
    this.accidents.delete(id);
    // Delete related data
    Array.from(this.witnesses.entries())
      .filter(([_, witness]) => witness.accidentId === id)
      .forEach(([witnessId]) => this.witnesses.delete(witnessId));
    
    Array.from(this.fragments.entries())
      .filter(([_, fragment]) => fragment.accidentId === id)
      .forEach(([fragmentId]) => this.fragments.delete(fragmentId));
  }

  async getAccidentCountForYear(year: number): Promise<number> {
    return Array.from(this.accidents.values())
      .filter(accident => new Date(accident.createdAt).getFullYear() === year)
      .length;
  }

  // Witness operations
  async getWitness(id: number): Promise<Witness | undefined> {
    return this.witnesses.get(id);
  }

  async getWitnessesByAccident(accidentId: number): Promise<Witness[]> {
    return Array.from(this.witnesses.values())
      .filter(witness => witness.accidentId === accidentId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async createWitness(witnessData: InsertWitness): Promise<Witness> {
    const id = this.currentWitnessId++;
    const witness: Witness = {
      ...witnessData,
      id,
      createdAt: new Date(),
    };
    this.witnesses.set(id, witness);
    return witness;
  }

  async updateWitness(id: number, updates: Partial<Witness>): Promise<Witness> {
    const witness = this.witnesses.get(id);
    if (!witness) throw new Error("Witness not found");
    
    const updatedWitness = { ...witness, ...updates };
    this.witnesses.set(id, updatedWitness);
    return updatedWitness;
  }

  async deleteWitness(id: number): Promise<void> {
    this.witnesses.delete(id);
  }

  // Fragment operations
  async getFragment(id: number): Promise<Fragment | undefined> {
    return this.fragments.get(id);
  }

  async getFragmentsByAccident(accidentId: number): Promise<Fragment[]> {
    return Array.from(this.fragments.values())
      .filter(fragment => fragment.accidentId === accidentId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async createFragment(fragmentData: InsertFragment): Promise<Fragment> {
    const id = this.currentFragmentId++;
    const fragment: Fragment = {
      ...fragmentData,
      id,
      createdAt: new Date(),
    };
    this.fragments.set(id, fragment);
    return fragment;
  }

  async updateFragment(id: number, updates: Partial<Fragment>): Promise<Fragment> {
    const fragment = this.fragments.get(id);
    if (!fragment) throw new Error("Fragment not found");
    
    const updatedFragment = { ...fragment, ...updates };
    this.fragments.set(id, updatedFragment);
    return updatedFragment;
  }

  async deleteFragment(id: number): Promise<void> {
    this.fragments.delete(id);
  }

  // Material evidence operations
  async getMaterialEvidence(id: number): Promise<MaterialEvidence | undefined> {
    return this.materialEvidence.get(id);
  }

  async getMaterialEvidenceByAccident(accidentId: number): Promise<MaterialEvidence[]> {
    return Array.from(this.materialEvidence.values())
      .filter(evidence => evidence.accidentId === accidentId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async createMaterialEvidence(evidenceData: InsertMaterialEvidence): Promise<MaterialEvidence> {
    const id = this.currentEvidenceId++;
    const evidence: MaterialEvidence = {
      ...evidenceData,
      id,
      createdAt: new Date(),
    };
    this.materialEvidence.set(id, evidence);
    return evidence;
  }

  async updateMaterialEvidence(id: number, updates: Partial<MaterialEvidence>): Promise<MaterialEvidence> {
    const evidence = this.materialEvidence.get(id);
    if (!evidence) throw new Error("Material evidence not found");
    
    const updatedEvidence = { ...evidence, ...updates };
    this.materialEvidence.set(id, updatedEvidence);
    return updatedEvidence;
  }

  async deleteMaterialEvidence(id: number): Promise<void> {
    this.materialEvidence.delete(id);
  }

  // Cause tree operations
  async getCauseTree(id: number): Promise<CauseTree | undefined> {
    return this.causeTrees.get(id);
  }

  async getCauseTreeByAccident(accidentId: number): Promise<CauseTree | undefined> {
    return Array.from(this.causeTrees.values())
      .find(tree => tree.accidentId === accidentId);
  }

  async createCauseTree(causeTreeData: InsertCauseTree): Promise<CauseTree> {
    const id = this.currentCauseTreeId++;
    const causeTree: CauseTree = {
      ...causeTreeData,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.causeTrees.set(id, causeTree);
    return causeTree;
  }

  async updateCauseTree(id: number, updates: Partial<CauseTree>): Promise<CauseTree> {
    const causeTree = this.causeTrees.get(id);
    if (!causeTree) throw new Error("Cause tree not found");
    
    const updatedCauseTree = { 
      ...causeTree, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.causeTrees.set(id, updatedCauseTree);
    return updatedCauseTree;
  }

  async deleteCauseTree(id: number): Promise<void> {
    this.causeTrees.delete(id);
  }

  // File operations
  async getFile(id: number): Promise<File | undefined> {
    return this.files.get(id);
  }

  async getFilesByAccident(accidentId: number): Promise<File[]> {
    return Array.from(this.files.values())
      .filter(file => file.accidentId === accidentId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async createFile(fileData: InsertFile): Promise<File> {
    const id = this.currentFileId++;
    const file: File = {
      ...fileData,
      id,
      createdAt: new Date(),
    };
    this.files.set(id, file);
    return file;
  }

  async deleteFile(id: number): Promise<void> {
    this.files.delete(id);
  }
}

export const storage = new MemStorage();
