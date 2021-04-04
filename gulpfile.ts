import * as del from 'del';
import * as gulp from 'gulp';
import * as rename from 'gulp-rename';
import * as shell from 'gulp-shell';
import { Gulpclass, SequenceTask, Task } from 'gulpclass/Decorators';
import * as minimist from 'minimist';

type Profile = 'staging' | 'production';

type ArgsType = {
  profile: Profile;
};

const args = minimist<ArgsType>(process.argv.slice(2), {
  alias: {
    profile: ['p'],
  } as Record<keyof ArgsType, string[] | string>,
  default: {
    profile: 'staging',
  } as ArgsType,
});

@Gulpclass()
export class Gulpfile {
  @Task()
  copy_secret() {
    return gulp.src(`env.${args.profile}.json`).pipe(rename('env.json')).pipe(gulp.dest('dist'));
  }

  @Task()
  clean_dist() {
    return del(['./dist/**']);
  }

  @Task()
  tsc() {
    return shell.task(`tsc`)();
  }

  @SequenceTask()
  build() {
    return ['clean_dist', 'tsc', 'copy_secret'];
  }

  @Task()
  fb_deploy() {
    return shell.task(`firebase -P ${args.profile} deploy --only functions,firestore,database`)();
  }

  @Task()
  fb_deploy_bot() {
    return shell.task(`firebase -P ${args.profile} deploy --only functions:bot`)();
  }

  @Task()
  fb_serve() {
    return shell.task(`firebase emulators:start --only functions,firestore,database`)();
  }

  @Task()
  fb_serve_functions() {
    return shell.task(`firebase emulators:start --only functions`)();
  }

  @SequenceTask()
  deploy() {
    return ['build', 'fb_deploy'];
  }

  @SequenceTask()
  deploy_bot() {
    return ['build', 'fb_deploy_bot'];
  }

  @SequenceTask()
  serve() {
    return ['build', 'fb_serve'];
  }

  @SequenceTask()
  serve_remote() {
    return ['build', 'fb_serve_functions'];
  }
}
