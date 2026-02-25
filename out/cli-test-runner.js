import { TEST_SUITE, runTestCase } from './services/testRunner';
async function main() {
    console.log('\n🚀 Starting SQL Snippet Master CLI Test Suite...');
    console.log('===============================================\n');
    let passedCount = 0;
    let failedCount = 0;
    const startTime = Date.now();
    for (const test of TEST_SUITE) {
        process.stdout.write(`⏳ [${test.category.padEnd(9)}] ${test.name.padEnd(30)} ... `);
        try {
            const result = await runTestCase(test);
            if (result.passed) {
                console.log(`✅ PASSED (${Math.round(result.duration)}ms)`);
                passedCount++;
            }
            else {
                console.log(`❌ FAILED`);
                console.error(`   Error: ${result.error}`);
                failedCount++;
            }
        }
        catch (err) {
            console.log(`💥 CRASHED`);
            console.error(`   Fatal: ${err.message}`);
            failedCount++;
        }
    }
    const totalTime = Date.now() - startTime;
    console.log('\n===============================================');
    console.log(`📊 SUMMARY:`);
    console.log(`   Total Tests:  ${TEST_SUITE.length}`);
    console.log(`   Passed:       ${passedCount}`);
    console.log(`   Failed:       ${failedCount}`);
    console.log(`   Time:         ${totalTime}ms`);
    console.log('===============================================\n');
    if (failedCount > 0) {
        console.log('❌ CI Status: FAILED\n');
        process.exit(1);
    }
    else {
        console.log('✨ CI Status: SUCCESS\n');
        process.exit(0);
    }
}
main().catch(err => {
    console.error('Fatal Runner Error:', err);
    process.exit(1);
});
