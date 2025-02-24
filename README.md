
## Description
It is a relational json db inspired by typeorm. It is an alternate to full-fledged relational db which typeorm supports. Purpose of this db is to be able to store a json or encrypted json file as a db remotely, avoiding the side-effects of ephemeral nature of server environment. 

This DB is recommended to use for your nestjs/nodejs: lightweight/hobby projects, prototypes, portfolios etc.

## Usage
Below are the steps to use this library.

### Step 1: Configure

This step is about configuring the DB. There are two mandatory methods `downloadDbJson()` and `downloadDbJson()` you need to provide to ready the db system. 

Below is an example:

```ts
import { JsonDB } from 'json-relational-db';
import { downloadDbJson, uploadDbJson } from './sync-file';

JsonDB.configure({
    downloadDbJson: downloadDbJson, 
    uploadDbJson: uploadDbJson,
  });
```

Below is an example of `downloadDbJson()` and `downloadDbJson()` methods/functions. It uses *google-cloud storage*, however, you can use any storage or local file:

```ts
import { Storage } from '@google-cloud/storage';


const storage = new Storage();

const fileName = 'db.json';
const bucketName = 'my-bucket';

export async function downloadDbJson(): Promise<object> {
    const res = await storage.bucket(bucketName).file(fileName).download();
    const object = JSON.parse(res.toString());
    return object;
}

export async function uploadDbJson(object: object): Promise<void> {
    await storage
      .bucket(bucketName)
      .file(fileName)
      .save(JSON.stringify(object));
}
```

### Step 2: Define Entities/Tables
This step is about defining entities/tables. Below is an example of creating an entity/table

```ts
import { Entity, Column, ColumnType } from 'json-relational-db';
import { projectEntity } from './project.entity';

export interface Skill {
  skill_id: number;
  name: string;
  description: string;
  proficiency: string;
  experience_in_month: number;
  proficiency_level: string;
}

export const skillEntity = new Entity<Skill>('skill', [
  new Column('skill_id', ColumnType.SERIAL),
  new Column('name', ColumnType.STRING),
  new Column('description', ColumnType.STRING),
  new Column('proficiency', ColumnType.NUMBER),
  new Column('experience_in_month', ColumnType.NUMBER),
  new Column('proficiency_level', ColumnType.STRING),
  new Column('project_id', projectEntity), //foreign key
]);
```

### Step 3: Use entity repository
This step is about using the entity repository. Below is a sample service class which makes use of the repository methods:

```ts
import { Skill, skillEntity } from 'src/entities';

export class SkillService {
  private readonly skillRepo = skillEntity.repository;


  async getAllSkills() {
    const skills = await this.skillRepo.find({
      order: { proficiency: 'DESC' },
    });
    return skills;
  }

  async addSkill(skills:Skill[]) {;
   return await this.skillRepo.save(skills);
  }

  async updateSkill(skill: Skill) {
    const s = await this.skillRepo.findOne({
      skill_id: skill.skillId,
    });

    if (!s) {
      throw new Error('Skill not found');
    }

    await this.skillRepo.update(
      {
        skill_id: s.skill_id,
      },
      skill
    );

    return skill;
  }
}
```

Below example shows how to make use of relations. In this example we are using 3 tables and querying the related data:

```ts
   async getMyProfile(
    query: GetMyProfile.Query
  ): Promise<MyProfileFullDTOWithId> {
    const profileId = +query.profileId;
    const myProfile = await this.myProfileRepo.findOne({
      my_profile_id: profileId,
    });
    if (myProfile == null) {
      throw new HttpException('Profile not found', HttpStatus.BAD_REQUEST);
    }

    const location = await this.locationRepo.find({
      where: { my_profile_id: profileId },
    });
    const professionalProfile = await this.professionalProfileRepo.find({
      where: {
        my_profile_id: profileId,
      },
    });

    return this.mapProfileDTOFromEntity(
      myProfile,
      location,
      professionalProfile
    );
  }
  ```

### Below is the source code
Github: [https://github.com/emreSlim/json-db](https://github.com/emreSlim/json-db)

Feel free to contact me or raise an issue about this package.