import * as del from 'del';
import * as gulp from 'gulp';
import * as confirm from 'gulp-confirm';
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
  copy_env() {
    return gulp
      .src(`assets/environments/env.${args.profile}.json`)
      .pipe(rename('env.json'))
      .pipe(gulp.dest('dist/assets/environments'));
  }

  @Task()
  copy_assets() {
    return gulp
      .src([`assets/**/*`, '!assets/environments/**/*'], { base: '.' })
      .pipe(gulp.dest('dist'));
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
    return ['clean_dist', 'tsc', 'copy_assets', 'copy_env'];
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
    return shell.task(
      `firebase -P ${args.profile} emulators:start --only functions,firestore,database`,
    )();
  }

  @Task()
  fb_serve_functions() {
    return shell.task(`firebase -P ${args.profile} emulators:start --only functions`)();
  }

  @Task()
  confirm_deploy() {
    return gulp.src('./package.json').pipe(
      confirm({
        question: `Type word '${args.profile}' to proceed deployment`,
        proceed: function (answer: string) {
          if (answer === args.profile) {
            return true;
          }
          throw new Error('Deployment aborted');
        },
      }),
    );
  }

  @SequenceTask()
  deploy() {
    return ['confirm_deploy', 'build', 'fb_deploy'];
  }

  @SequenceTask()
  deploy_bot() {
    return ['confirm_deploy', 'build', 'fb_deploy_bot'];
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
